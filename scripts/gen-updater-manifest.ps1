# Delegates to Node (UTF-8 safe on all shells). Prefer: npm run release:updater-json
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
node scripts/gen-updater-manifest.mjs @args
