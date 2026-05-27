import type { APIRoute } from "astro";
import { fetchAlbumSongs } from "../../api/netease";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const albumId = body.id || body.albumId;

        if (!albumId) {
            return new Response(
                JSON.stringify({ error: "id is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const songs = await fetchAlbumSongs(albumId);
        return new Response(JSON.stringify({ songs }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("[API] Album songs error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch album songs" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
