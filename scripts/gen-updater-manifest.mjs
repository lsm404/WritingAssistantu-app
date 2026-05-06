/**
 * After `tauri build`, writes src-tauri/target/release/bundle/<nsis|msi>/latest.json
 * next to setup / .zip / .sig.
 *
 * URL (first match wins):
 *   - env UPDATER_ARTIFACT_URL (full HTTPS URL to the hot-update .zip)
 *   - env UPDATER_CDN_BASE + "/" + encodeURIComponent(zipFileName)
 *   - file updater/cdn-base.txt (one line, same as UPDATER_CDN_BASE)
 *
 * Notes (first non-empty):
 *   - env UPDATER_NOTES
 *   - file updater/notes.txt (UTF-8)
 *
 * If no URL can be resolved: prints a skip message and exits 0 (does not fail the build).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const flavor = process.env.UPDATER_BUNDLE_FLAVOR === "msi" ? "msi" : "nsis";
const bundleDir = join(root, "src-tauri", "target", "release", "bundle", flavor);
const zipSuffix = flavor === "msi" ? ".msi.zip" : ".nsis.zip";
const sigSuffix = `${zipSuffix}.sig`;

function readCargoVersion() {
  const cargoPath = join(root, "src-tauri", "Cargo.toml");
  const text = readFileSync(cargoPath, "utf8");
  const m = text.match(/^\s*version\s*=\s*"([^"]+)"/m);
  if (!m) throw new Error("Cannot parse version from src-tauri/Cargo.toml");
  return m[1].trim();
}

function findNewestZipFilename() {
  if (!existsSync(bundleDir)) {
    console.warn(`[updater-manifest] bundle dir missing: ${bundleDir}`);
    return null;
  }
  const names = readdirSync(bundleDir).filter(
    (f) => f.endsWith(zipSuffix) && !f.endsWith(".sig"),
  );
  if (!names.length) {
    console.warn(`[updater-manifest] no *${zipSuffix} in ${bundleDir}`);
    return null;
  }
  let best = names[0];
  let bestT = statSync(join(bundleDir, best)).mtimeMs;
  for (let i = 1; i < names.length; i++) {
    const n = names[i];
    const t = statSync(join(bundleDir, n)).mtimeMs;
    if (t > bestT) {
      bestT = t;
      best = n;
    }
  }
  return best;
}

function resolveArtifactUrl(zipName) {
  const full = process.env.UPDATER_ARTIFACT_URL?.trim();
  if (full) return full;

  let base = process.env.UPDATER_CDN_BASE?.trim() || "";
  const cdnFile = join(root, "updater", "cdn-base.txt");
  if (!base && existsSync(cdnFile)) {
    base = readFileSync(cdnFile, "utf8").trim();
  }
  if (!base) return "";

  const clean = base.replace(/\/+$/, "");
  return `${clean}/${encodeURIComponent(zipName)}`;
}

function resolveNotes() {
  const env = process.env.UPDATER_NOTES;
  if (env != null && String(env).trim() !== "") return String(env).replace(/\r\n/g, "\n").trimEnd();

  const notesFile = join(root, "updater", "notes.txt");
  if (existsSync(notesFile)) {
    return readFileSync(notesFile, "utf8").trimEnd();
  }
  return "";
}

function main() {
  const zipName = findNewestZipFilename();
  if (!zipName) {
    console.warn("[updater-manifest] skip: no updater zip artifact.");
    process.exit(0);
  }

  const artifactUrl = resolveArtifactUrl(zipName);
  if (!artifactUrl) {
    console.warn(
      "[updater-manifest] skip: set UPDATER_ARTIFACT_URL, or UPDATER_CDN_BASE, or updater/cdn-base.txt",
    );
    process.exit(0);
  }

  const sigPath = join(bundleDir, `${zipName}.sig`);
  if (!existsSync(sigPath)) {
    console.warn(`[updater-manifest] skip: missing signature file ${sigPath}`);
    process.exit(0);
  }

  const signature = readFileSync(sigPath, "utf8").trim();
  if (!signature) {
    console.warn("[updater-manifest] skip: empty signature");
    process.exit(0);
  }

  const version = (process.env.UPDATER_VERSION || readCargoVersion()).trim().replace(/^v/, "");
  const notes = resolveNotes();
  const pub_date = process.env.UPDATER_PUB_DATE?.trim() || new Date().toISOString();

  const doc = {
    version,
    notes,
    pub_date,
    platforms: {
      "windows-x86_64": {
        url: artifactUrl,
        signature,
      },
    },
  };

  const outPath = join(bundleDir, "latest.json");
  writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  console.log(`[updater-manifest] OK: ${outPath}`);
  console.log(`[updater-manifest] zip: ${zipName}`);
}

main();
