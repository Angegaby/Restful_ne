# PostgreSQL backup script for FEMS
param(
    [string]$Host = "localhost",
    [int]$Port = 5432,
    [string]$User = "postgres",
    [string]$Database = "fems_db",
    [string]$OutputDir = ".\backups"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $OutputDir "fems_backup_$timestamp.sql"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

Write-Host "Backing up $Database to $outFile ..."
$env:PGPASSWORD = Read-Host "Enter PostgreSQL password for $User" -AsSecureString
# Note: For automation, set PGPASSWORD environment variable before running

pg_dump -h $Host -p $Port -U $User -d $Database -F p -f $outFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed: $outFile"
} else {
    Write-Host "Backup failed. Ensure pg_dump is in PATH and PostgreSQL is running."
    exit 1
}
