param(
    [string]$OutputDirectory = ""
)

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDirectory = Resolve-Path (Join-Path $scriptDirectory "..\..")

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $projectDirectory "deploy\server-transfer"
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$resolvedOutput = Resolve-Path $OutputDirectory

$latestDump = Get-ChildItem (Join-Path $projectDirectory "database-backups") -File -Filter "*.dump" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $latestDump) {
    throw "No .dump database backup was found in database-backups."
}

$databaseTarget = Join-Path $resolvedOutput "database.dump"
Copy-Item -LiteralPath $latestDump.FullName -Destination $databaseTarget -Force

$uploadsDirectory = Join-Path $projectDirectory "backend\uploads"
$uploadsTarget = Join-Path $resolvedOutput "uploads.tar.gz"
if (Test-Path -LiteralPath $uploadsDirectory) {
    tar -czf $uploadsTarget -C $uploadsDirectory .
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the uploads archive."
    }
}

Write-Output "Server transfer package created at: $resolvedOutput"
Write-Output "Database source: $($latestDump.Name)"
