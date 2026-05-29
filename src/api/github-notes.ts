export interface Note {
    thema: string;
    title: string;
    description: string;
    slug: string;
    created: string;
    edited: string;
    content: string;
}

export interface NotesData {
    lastUpdated: string;
    count: number;
    [category: string]: Note[] | string | number;
}

const GARDEN_DATA_URL =
    "https://raw.githubusercontent.com/Ahua-lage/preson-obsidian/main/output/digital-garden.json";

function getAuthToken(): string {
    const token = import.meta.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error(
            "GITHUB_TOKEN environment variable is not set. Please add it to your .env file.",
        );
    }
    return token.trim();
}

function getAuthHeader(token: string): { Authorization: string } {
    if (token.startsWith("github_pat_")) {
        return { Authorization: `Bearer ${token}` };
    }
    return { Authorization: `token ${token}` };
}

export async function fetchNotes(): Promise<NotesData> {
    const token = getAuthToken();
    const response = await fetch(GARDEN_DATA_URL, {
        headers: {
            ...getAuthHeader(token),
            Accept: "application/vnd.github.v3.raw",
        },
    });

    if (!response.ok) {
        let detail = response.statusText;
        if (response.status === 404) {
            detail =
                "Not Found - The file 'output/digital-garden.json' does not exist in the repository, or your token lacks access to this repository.";
        } else if (response.status === 401 || response.status === 403) {
            detail =
                "Authentication failed - Check that your GITHUB_TOKEN is valid and has 'repo' permission for this repository.";
        }

        throw new Error(
            `Failed to fetch notes (${response.status}): ${detail}`,
        );
    }

    return response.json();
}

export function getAllNotes(data: NotesData): Note[] {
    const notes: Note[] = [];
    const excludedKeys = ["lastUpdated", "count"];

    for (const key of Object.keys(data)) {
        if (!excludedKeys.includes(key) && Array.isArray(data[key])) {
            notes.push(...(data[key] as Note[]));
        }
    }

    return notes;
}

export function getCategories(data: NotesData): string[] {
    const excludedKeys = ["lastUpdated", "count"];
    return Object.keys(data).filter(
        (key) => !excludedKeys.includes(key) && Array.isArray(data[key]),
    );
}