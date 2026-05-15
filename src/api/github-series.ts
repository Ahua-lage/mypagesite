export interface Series {
    title: string;
    season: string;
    genre: string[];
    director: string[];
    rating: number | null;
    imdbScore: number;
    cast: string[];
    cover: string;
    released: string;
    finished: string | null;
    added: string;
    status: string;
    favorite?: boolean;
}

export interface SeriesData {
    lastUpdated: string;
    count: number;
    aktiv: Series[];
    merkliste: Series[];
    pausiert: Series[];
    abgeschlossen: Record<string, Series[]>;
}

const TIMEOUT_MS = 5000;

export async function fetchSeries(): Promise<SeriesData> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(
            "https://raw.githubusercontent.com/your-github-username/your-data-repo/main/output/series.json",
            {
                headers: {
                    Authorization: `token ${import.meta.env.GITHUB_TOKEN}`,
                    Accept: "application/vnd.github.v3.raw",
                },
                signal: controller.signal,
            },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch series: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.warn("Failed to fetch series, returning empty data:", error);
        return {
            lastUpdated: new Date().toISOString(),
            count: 0,
            aktiv: [],
            merkliste: [],
            pausiert: [],
            abgeschlossen: {}
        };
    }
}
