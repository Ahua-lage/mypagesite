import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { frontmatter: {}, body: content };

    const raw = match[1];
    const body = match[2].trim();
    const frontmatter = {};

    const lines = raw.split("\n");
    let currentKey = null;
    let currentArray = null;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("- ") && currentKey) {
            const val = trimmed.slice(2).replace(/^["']|["']$/g, "").trim();
            if (Array.isArray(frontmatter[currentKey])) {
                frontmatter[currentKey].push(val);
            } else {
                frontmatter[currentKey] = [val];
            }
            continue;
        }

        const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
        if (!kvMatch) continue;

        currentKey = kvMatch[1];
        let val = kvMatch[2].trim();

        if (val === "") {
            frontmatter[currentKey] = [];
            continue;
        }

        val = val.replace(/^["']|["']$/g, "");

        if (val.startsWith("[") && val.endsWith("]")) {
            frontmatter[currentKey] = val
                .slice(1, -1)
                .split(",")
                .map((v) => v.trim().replace(/^["']|["']$/g, ""))
                .filter((v) => v);
        } else if (val === "true") {
            frontmatter[currentKey] = true;
        } else if (val === "false") {
            frontmatter[currentKey] = false;
        } else {
            frontmatter[currentKey] = val;
        }
    }

    return { frontmatter, body };
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function extractDate(filePath, frontmatter, stat) {
    const dateKeys = ["date", "created", "created_at", "published"];
    for (const key of dateKeys) {
        if (frontmatter[key]) {
            const d = new Date(frontmatter[key]);
            if (!isNaN(d.getTime())) return d.toISOString();
        }
    }
    return stat.birthtime.toISOString();
}

function extractEditedDate(frontmatter) {
    const dateKeys = [
        "updated",
        "modified",
        "edited",
        "lastmod",
        "last_modified",
    ];
    for (const key of dateKeys) {
        if (frontmatter[key]) {
            const d = new Date(frontmatter[key]);
            if (!isNaN(d.getTime())) return d.toISOString();
        }
    }
    return null;
}

function findMdFiles(dir, baseDir = null) {
    const results = [];
    const base = baseDir || dir;

    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
                results.push(...findMdFiles(fullPath, base));
            }
        } else if (
            entry.name.endsWith(".md") &&
            !entry.name.startsWith("_")
        ) {
            const relativeDir = path.dirname(path.relative(base, fullPath));
            results.push({ filePath: fullPath, relativeDir });
        }
    }

    return results;
}

function generateGardenJson(vaultDir, outputPath) {
    console.log(`Scanning vault: ${vaultDir}`);

    const mdFiles = findMdFiles(vaultDir, vaultDir);
    console.log(`Found ${mdFiles.length} markdown files`);

    const notesByCategory = {};

    for (const { filePath, relativeDir } of mdFiles) {
        const content = fs.readFileSync(filePath, "utf-8");
        const { frontmatter, body } = parseFrontmatter(content);
        const stat = fs.statSync(filePath);

        const thema = relativeDir || "Uncategorized";
        const title =
            frontmatter.title || path.basename(filePath, ".md");
        const fileName = path.basename(filePath, ".md");
        const slug =
            frontmatter.slug ||
            (frontmatter.aliases
                ? slugify(
                      Array.isArray(frontmatter.aliases)
                          ? frontmatter.aliases[0]
                          : frontmatter.aliases,
                  )
                : undefined) ||
            slugify(fileName);

        if (!notesByCategory[thema]) {
            notesByCategory[thema] = [];
        }

        const created = extractDate(filePath, frontmatter, stat);
        const edited = extractEditedDate(frontmatter);

        if (frontmatter.tags && !frontmatter.thema) {
            frontmatter.thema = thema;
        }

        const note = {
            thema,
            title,
            description: frontmatter.description || frontmatter.desc || "",
            slug,
            created,
            edited: edited || created,
            content: body || content,
        };

        notesByCategory[thema].push(note);
    }

    const excludedKeys = ["lastUpdated", "count"];
    let totalCount = 0;
    for (const key of Object.keys(notesByCategory)) {
        totalCount += notesByCategory[key].length;
    }

    const output = {
        lastUpdated: new Date().toISOString(),
        count: totalCount,
        ...notesByCategory,
    };

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(
        `Generated ${outputPath} with ${totalCount} notes across ${Object.keys(notesByCategory).length} categories`,
    );
}

const vaultDir = process.argv[2] || ".";
const outputPath =
    process.argv[3] || path.join(__dirname, "..", "output", "digital-garden.json");

generateGardenJson(path.resolve(vaultDir), path.resolve(outputPath));