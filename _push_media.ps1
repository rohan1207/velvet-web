# Push remaining public media in small batches to avoid HTTP 408
$ErrorActionPreference = "Stop"
Set-Location "C:\Projects\Velvel_shell"

git config http.version HTTP/1.1
git config http.postBuffer 524288000

function Push-Batch([string]$Message) {
  $staged = git diff --cached --name-only
  if (-not $staged) {
    Write-Host "Nothing staged for: $Message" -ForegroundColor Yellow
    return
  }
  git commit -m $Message
  Write-Host "Pushing: $Message" -ForegroundColor Cyan
  git push origin main
  Write-Host "OK: $Message" -ForegroundColor Green
}

git add .gitignore public/.gitignore
if (git diff --cached --name-only) {
  git commit -m "track site images again; keep videos ignored"
  git push origin main
}

Write-Host "`n=== Batch 1: categories + hero ===" -ForegroundColor Cyan
git add public/categories public/hero
Push-Batch "add public categories and hero assets"

Write-Host "`n=== Batch 2: public/images (root + folders except mobile) ===" -ForegroundColor Cyan
Get-ChildItem public/images -File -ErrorAction SilentlyContinue | ForEach-Object { git add $_.FullName }
Get-ChildItem public/images -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -ne "mobile" } |
  ForEach-Object { git add $_.FullName }
Push-Batch "add public site images (desktop)"

Write-Host "`n=== Batch 3: public/images/mobile ===" -ForegroundColor Cyan
if (Test-Path "public/images/mobile") {
  git add public/images/mobile
  Push-Batch "add public mobile images"
}

Write-Host "`n=== Batch 4: flower-frames ===" -ForegroundColor Cyan
if (Test-Path "public/flower-frames") {
  git add public/flower-frames
  Push-Batch "add flower-frames assets"
}

Write-Host "`n=== Summary ===" -ForegroundColor Green
git status
Write-Host "Still ignored (not pushed): *.mp4, *.pdf, _git_trace.log"
Write-Host "Repo: https://github.com/rohan1207/velvet-web"
