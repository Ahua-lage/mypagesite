import type { APIRoute } from "astro";
import { fetchSongUrl } from "../../api/netease";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const songId = body.id || body.songId;

        if (!songId) {
            return new Response(
                JSON.stringify({ error: "id is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const url = await fetchSongUrl(songId);
        return new Response(JSON.stringify({ url }), {
            status: 200,
            headers: { "Content-Type": "application/json" } ,
        });
    } catch (error) {
        console.error("[API] Song URL error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch song url" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
