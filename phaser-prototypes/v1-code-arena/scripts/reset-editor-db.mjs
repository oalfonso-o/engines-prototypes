import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const outputPath = resolve(root, ".editor-reset-token.json");
const token = new Date().toISOString();

await mkdir(root, { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ token }, null, 2)}\n`, "utf8");

console.log(`Updated ${outputPath}`);
console.log("Reload the app once and the local editor DB will be reset and seeded again.");
