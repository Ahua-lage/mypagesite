import { readFileSync, existsSync } from "fs";
import { fileURLToPath, URL } from "url";
import NeteaseCloudMusicApi from "NeteaseCloudMusicApi";

interface NeteaseArtist {
    id?: number;
    name: string;
}

interface NeteaseAlbumBrief {
    id: number;
    name: string;
    picUrl?: string;
}

interface NeteaseSong {
    id: number;
    name: string;
    ar?: NeteaseArtist[];
    al?: NeteaseAlbumBrief;
}

interface NeteasePlayRecord {
    playCount: number;
    song: NeteaseSong;
}

interface NeteasePlaylist {
    id: number;
    name: string;
    trackCount?: number;
    coverImgUrl?: string;
}

export interface AlbumDetails {
    albumId: number;
    title: string;
    artist: string;
    cover: string;
    playCount: number;
    url: string;
}

export interface SongInfo {
    id: number;
    name: string;
    artist: string;
    cover: string;
}

let _cachedCookie: string | null = null;
let _cachedUserId: string | null = null;

function getCookie(): string {
    if (_cachedCookie) return _cachedCookie;

    try {
        const cookieFilePath = fileURLToPath(new URL("./netease-cookie.txt", import.meta.url));
        if (existsSync(cookieFilePath)) {
            const cookie = readFileSync(cookieFilePath, "utf-8").trim();
            if (cookie && cookie.length > 100) {
                _cachedCookie = cookie;
                return cookie;
            }
        }
    } catch (_) {}

    _cachedCookie = import.meta.env.NETEASE_COOKIE || "";
    return _cachedCookie;
}

async function getActualUserId(): Promise<string> {
    if (_cachedUserId) return _cachedUserId;

    try {
        const data = await NeteaseCloudMusicApi.login_status({
            cookie: getCookie(),
        });

        const account = data?.body?.data?.account;
        if (account && !account.anonimousUser) {
            const profile = data.body.data.profile;
            _cachedUserId = profile?.userId?.toString() || account?.id?.toString();
            console.log("[NeteaseAPI] Login as:", profile?.nickname, "userId:", _cachedUserId);
            return _cachedUserId!;
        }

        console.warn("[NeteaseAPI] Cookie invalid or expired");
    } catch (error) {
        console.error("[NeteaseAPI] login_status failed:", error);
    }

    return "";
}

function groupPlayRecordsByAlbum(records: NeteasePlayRecord[]): AlbumDetails[] {
    const albumMap = new Map<number, AlbumDetails>();

    for (const record of records) {
        const album = record.song.al;
        if (!album || !album.id) continue;

        const existing = albumMap.get(album.id);
        if (existing) {
            existing.playCount += record.playCount;
        } else {
            albumMap.set(album.id, {
                albumId: album.id,
                title: album.name,
                artist: record.song.ar?.map((a) => a.name).join(" / ") || "未知艺术家",
                cover: album.picUrl || "",
                playCount: record.playCount,
                url: `https://music.163.com/#/album?id=${album.id}`,
            });
        }
    }

    return Array.from(albumMap.values()).sort((a, b) => b.playCount - a.playCount);
}

function groupSongsByAlbum(songs: NeteaseSong[]): AlbumDetails[] {
    const albumMap = new Map<number, AlbumDetails>();

    for (const song of songs) {
        const album = song.al;
        if (!album || !album.id) continue;

        if (!albumMap.has(album.id)) {
            albumMap.set(album.id, {
                albumId: album.id,
                title: album.name,
                artist: song.ar?.map((a) => a.name).join(" / ") || "未知艺术家",
                cover: album.picUrl || "",
                playCount: 0,
                url: `https://music.163.com/#/album?id=${album.id}`,
            });
        }
    }

    return Array.from(albumMap.values());
}

export async function fetchRecentAlbums(limit: number = 12): Promise<AlbumDetails[]> {
    try {
        const uid = await getActualUserId();
        if (!uid) return [];

        try {
            const res = await NeteaseCloudMusicApi.record_recent_album({
                limit: 50,
                cookie: getCookie(),
            });

            const list = (res?.body?.data?.list as any[]) || [];
            if (list.length > 0) {
                return list.slice(0, limit).map((item: any) => {
                    const d = item.data || item;
                    return {
                        albumId: d.id || 0,
                        title: d.name || "未知专辑",
                        artist: d.artist?.name || d.artists?.[0]?.name || "未知艺术家",
                        cover: d.picUrl || "",
                        playCount: 0,
                        url: `https://music.163.com/#/album?id=${d.id || 0}`,
                    };
                });
            }
        } catch (_) {}

        const data = await NeteaseCloudMusicApi.user_record({
            uid,
            type: 1,
            cookie: getCookie(),
        });

        const records = (data?.body?.weekData as NeteasePlayRecord[]) || [];
        return groupPlayRecordsByAlbum(records).slice(0, limit);
    } catch (error) {
        console.error("Failed to fetch recent albums:", error);
        return [];
    }
}

export async function fetchAllTimeAlbums(limit: number = 12): Promise<AlbumDetails[]> {
    try {
        const uid = await getActualUserId();
        if (!uid) return [];

        const data = await NeteaseCloudMusicApi.user_record({
            uid,
            type: 0,
            cookie: getCookie(),
        });

        const records = (data?.body?.allData as NeteasePlayRecord[]) || [];
        return groupPlayRecordsByAlbum(records).slice(0, limit);
    } catch (error) {
        console.error("Failed to fetch all-time albums:", error);
        return [];
    }
}

async function fetchLikedPlaylistId(): Promise<string | null> {
    try {
        const uid = await getActualUserId();
        if (!uid) return null;

        const data = await NeteaseCloudMusicApi.user_playlist({
            uid,
            limit: 30,
            cookie: getCookie(),
        });

        const playlists = (data?.body?.playlist as NeteasePlaylist[]) || [];

        for (const playlist of playlists) {
            if (playlist.name.includes("我喜欢的音乐") || playlist.name.includes("喜欢的音乐")) {
                return playlist.id.toString();
            }
        }

        if (playlists.length > 0) {
            return playlists[0].id.toString();
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch liked playlist:", error);
        return null;
    }
}

export async function fetchAlbumSongs(albumId: string | number): Promise<SongInfo[]> {
    try {
        const data = await NeteaseCloudMusicApi.album({
            id: String(albumId),
            cookie: getCookie(),
        });
        const songs = (data?.body?.songs as NeteaseSong[]) || [];

        return songs.map((song) => ({
            id: song.id,
            name: song.name,
            artist: song.ar?.map((a) => a.name).join(" / ") || "未知艺术家",
            cover: song.al?.picUrl || "",
        }));
    } catch (error) {
        console.error("Failed to fetch album songs:", error);
        return [];
    }
}

export async function fetchSongUrl(songId: string | number): Promise<string | null> {
    try {
        const data = await NeteaseCloudMusicApi.song_url({
            id: String(songId),
            br: 320000,
            cookie: getCookie(),
        });
        const songs = (data?.body?.data as { url: string }[]) || [];
        return songs[0]?.url || null;
    } catch (error) {
        console.error("Failed to fetch song url:", error);
        return null;
    }
}

export async function fetchLikedSongs(limit: number = 12): Promise<AlbumDetails[]> {
    try {
        const playlistId = await fetchLikedPlaylistId();
        if (!playlistId) return [];

        const data = await NeteaseCloudMusicApi.playlist_detail({
            id: playlistId,
            s: 0,
            cookie: getCookie(),
        });

        const tracks = (data?.body?.playlist?.tracks as NeteaseSong[]) || [];

        if (tracks.length === 0) {
            const trackIds = (data?.body?.playlist?.trackIds as { id: number }[]) || [];
            if (trackIds.length > 0) {
                const ids = trackIds.slice(0, 50).map((t) => t.id).join(",");
                const songsData = await NeteaseCloudMusicApi.song_detail({
                    ids,
                    cookie: getCookie(),
                });
                const songs = (songsData?.body?.songs as NeteaseSong[]) || [];
                return groupSongsByAlbum(songs).slice(0, limit);
            }
        }

        return groupSongsByAlbum(tracks).slice(0, limit);
    } catch (error) {
        console.error("Failed to fetch liked songs:", error);
        return [];
    }
}
