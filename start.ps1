$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$runtimePython = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
if (Test-Path -LiteralPath $runtimePython) { $pythonExe = $runtimePython }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $pythonExe = (Get-Command python).Source }
else { Write-Host 'Python is required. Alternatively open dist with VS Code Live Server.'; Read-Host 'Press Enter'; exit 1 }
Write-Host 'GiftQuest: http://127.0.0.1:8766'
Write-Host 'Keep this window open. Press Ctrl+C to stop.'
Start-Process 'http://127.0.0.1:8766'
& $pythonExe -m http.server 8766 --bind 127.0.0.1 --directory dist
