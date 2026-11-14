Set-Location C:\Projects\Velvel_shell
git config http.version HTTP/1.1
git config http.postBuffer 524288000
git fetch origin
git checkout main
git pull --rebase origin main 2>$null
git reset HEAD
git status -sb

function Go($paths, $msg) {
  git add -- $paths
  $n = @(git diff --cached --name-only).Count
  if ($n -eq 0) { Write-Host "skip $msg"; return }
  Write-Host "COMMIT $msg ($n files)" -ForegroundColor Cyan
  git commit -m $msg
  git push origin main
  if ($LASTEXITCODE -ne 0) { throw "fail $msg" }
  Write-Host "OK $msg" -ForegroundColor Green
}

if (Test-Path public\images\mobile) {
  Get-ChildItem public\images\mobile -Directory | ForEach-Object {
    Go $_.FullName ("add mobile/" + $_.Name)
  }
  $files = Get-ChildItem public\images\mobile -File
  if ($files) { Go ($files.FullName) "add mobile root images" }
}

if (Test-Path public\flower-frames) {
  $all = @(Get-ChildItem public\flower-frames -File)
  $half = [Math]::Ceiling($all.Count / 2)
  Go ($all[0..($half-1)].FullName) "add flower-frames 1"
  if ($all.Count -gt $half) {
    Go ($all[$half..($all.Count-1)].FullName) "add flower-frames 2"
  }
}

Go @("_push_rest.ps1","_finish_push.ps1","_push_media.ps1") "chore: keep push scripts"
Write-Host "ALL DONE" -ForegroundColor Green
git status -sb
