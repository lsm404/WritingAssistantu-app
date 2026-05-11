import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function sync() {
  const pkgPath = join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const version = pkg.version;

  console.log(`Syncing version ${version} to Tauri config files...`);

  // Update Cargo.toml
  const cargoPath = join(root, 'src-tauri', 'Cargo.toml');
  let cargoText = readFileSync(cargoPath, 'utf8');
  cargoText = cargoText.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
  writeFileSync(cargoPath, cargoText, 'utf8');
  console.log(`Updated src-tauri/Cargo.toml`);

  // Update tauri.conf.json
  const tauriConfPath = join(root, 'src-tauri', 'tauri.conf.json');
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = version;
  writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
  console.log(`Updated src-tauri/tauri.conf.json`);
}

sync();
