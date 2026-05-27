export const prerender = false;

export async function GET() {
    return new Response(JSON.stringify({ error: "Use POST method" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST({ request }) {
    try {
        const text = await request.text();
        let body;
        
        try {
            body = JSON.parse(text);
        } catch (e) {
            return new Response(
                JSON.stringify({ error: "Invalid JSON body", received: text }),
                { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }
        
        const { url: audioUrl } = body;

        if (!audioUrl) {
            return new Response(JSON.stringify({ 
                error: "Missing audio URL",
                body: body
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log("[ProxyAudio] Fetching:", audioUrl.substring(0, 80));
        
        const response = await fetch(audioUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://music.163.com/',
            },
        });
        
        if (!response.ok) {
            console.log("[ProxyAudio] Failed:", response.status, response.statusText);
            return new Response(JSON.stringify({ error: "Failed to fetch audio", status: response.status }), {
                status: response.status,
                headers: { "Content-Type": "application/json" },
            });
        }

        const contentType = response.headers.get('content-type') || 'audio/mpeg';
        const contentLength = response.headers.get('content-length');
        
        console.log("[ProxyAudio] Success, content-type:", contentType);
        
        return new Response(response.body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': contentLength || '',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error("[ProxyAudio] Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", details: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
