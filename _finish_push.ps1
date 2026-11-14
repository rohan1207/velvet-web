$ErrorActionPreference = "Stop"
Set-Location "C:\Projects\Velvel_shell"

git config http.version HTTP/1.1
git config http.postBuffer 524288000
git remote set-url origin https://github.com/rohan1207/velvet-web.git
git fetch origin

Write-Host "Resetting local commits onto origin/main (files stay on disk)..." -ForegroundColor Yellow
git reset --soft origin/main
git restore --staged .

function Push-Batch([string[]]$Paths, [string]$Msg) {
  $exist = @()
  foreach ($p in $Paths) { if (Test-Path $p) { $exist += $p } }
  if ($exist.Count -eq 0) { Write-Host "skip: $Msg"; return }

  git add -- $exist
  $staged = @(git diff --cached --name-only)
  if ($staged.Count -eq 0) { Write-Host "skip empty: $Msg"; return }

  $bytes = 0L
  foreach ($f in $staged) {
    if (Test-Path $f) { $bytes += (Get-Item -LiteralPath $f).Length }
  }
  $mb = [math]::Round($bytes / 1MB, 2)
  Write-Host "`n>>> $Msg ($($staged.Count) files, $mb MB)" -ForegroundColor Cyan
  if ($mb -gt 22) {
    Write-Host "WARNING batch >22MB may timeout" -ForegroundColor Yellow
  }

  git commit -m $Msg
  git push -u origin main
  if ($LASTEXITCODE -ne 0) { throw "PUSH FAILED: $Msg" }
  Write-Host "OK $Msg" -ForegroundColor Green
}

Push-Batch @(".gitignore","public/.gitignore","_finish_push.ps1","_push_media.ps1") "chore: gitignore and push helpers"

Push-Batch @("public/categories") "add public/categories"
Push-Batch @("public/hero") "add public/hero"

# desktop image files at root of public/images
if (Test-Path "public/images") {
  $rootFiles = Get-ChildItem "public/images" -File | ForEach-Object { $_.FullName }
  if ($rootFiles) { Push-Batch $rootFiles "add public/images root files" }

  Get-ChildItem "public/images" -Directory | Where-Object { $_.Name -ne "mobile" } | ForEach-Object {
    Push-Batch @($_.FullName) ("add public/images/" + $_.Name)
  }

  if (Test-Path "public/images/mobile") {
    Get-ChildItem "public/images/mobile" -File -ErrorAction SilentlyContinue | ForEach-Object {
      Push-Batch @($_.FullName) ("add mobile file " + $_.Name)
    }
    Get-ChildItem "public/images/mobile" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
      Push-Batch @($_.FullName) ("add public/images/mobile/" + $_.Name)
    }
  }
}

if (Test-Path "public/flower-frames") {
  # flower frames can be large - push half at a time if many
  $frames = Get-ChildItem "public/flower-frames" -File
  $mid = [math]::Ceiling($frames.Count / 2)
  if ($frames.Count -gt 0) {
    Push-Batch ($frames[0..($mid-1)] | ForEach-Object { $_.FullName }) "add flower-frames part 1"
  }
  if ($frames.Count -gt $mid) {
    Push-Batch ($frames[$mid..($frames.Count-1)] | ForEach-Object { $_.FullName }) "add flower-frames part 2"
  }
}

Write-Host "`n=== FINAL ===" -ForegroundColor Green
git status -sb
git log --oneline origin/main..HEAD
git log --oneline -8
Write-Host "Videos/PDFs still ignored. Site images should be on GitHub now." -ForegroundColor Green
Write-Host "https://github.com/rohan1207/velvet-web"
