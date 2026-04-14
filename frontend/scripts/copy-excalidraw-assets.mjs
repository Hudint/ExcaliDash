import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");

const EXCALIDRAW_DIST_DIR = path.join(
  frontendRoot,
  "node_modules",
  "@excalidraw",
  "excalidraw",
  "dist"
);

const copyDir = async (src, dest) => {
  await fs.rm(dest, { recursive: true, force: true });
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.cp(src, dest, { recursive: true });
};

const getTargets = () => {
  const args = new Set(process.argv.slice(2));
  const targets = [];
  if (args.has("--public")) targets.push("public");
  if (args.has("--dist")) targets.push("dist");
  return targets.length > 0 ? targets : ["dist"];
};

// In Excalidraw 0.18.0 the asset layout changed:
//   dev  fonts:  dist/dev/fonts/
//   prod fonts:  dist/prod/fonts/
// Both are copied to <target>/fonts/ so EXCALIDRAW_ASSET_PATH = "/" resolves them.
const main = async () => {
  const targets = getTargets();

  for (const targetName of targets) {
    const targetRoot = path.join(frontendRoot, targetName);
    await fs.mkdir(targetRoot, { recursive: true });

    // Choose the matching build variant for the target directory.
    const variant = targetName === "public" ? "dev" : "prod";
    const src = path.join(EXCALIDRAW_DIST_DIR, variant, "fonts");
    const dest = path.join(targetRoot, "fonts");

    try {
      await fs.access(src);
    } catch (err) {
      console.error(`[copy-excalidraw-assets] Missing source dir: ${src}`);
      throw err;
    }

    await copyDir(src, dest);
    console.log(`[copy-excalidraw-assets] Copied ${variant}/fonts -> ${targetName}/fonts`);
  }
};

await main();
