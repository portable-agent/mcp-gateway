$ErrorActionPreference = "Stop"

$requiredFiles = @(
    "README.md",
    "SERVICE.md",
    "AGENTS.md",
    "catalog-info.yaml",
    "mkdocs.yml",
    "docs/index.md",
    "docs/architecture.md",
    "docs/development.md",
    "docs/runbook.md",
    "docs/decisions/0001-gateway-boundary.md"
)

$missingFiles = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) }
if ($missingFiles.Count -gt 0) {
    throw "Required files are missing: $($missingFiles -join ', ')"
}

$catalogText = Get-Content -LiteralPath "catalog-info.yaml" -Raw
if ($catalogText -notmatch "backstage\.io/techdocs-ref:\s*dir:\.") {
    throw "catalog-info.yaml has no backstage.io/techdocs-ref: dir:."
}

$mkdocsText = Get-Content -LiteralPath "mkdocs.yml" -Raw
if ($mkdocsText -notmatch "(?m)^docs_dir:\s*docs\s*$") {
    throw "mkdocs.yml must contain docs_dir: docs."
}

Write-Host "MCP Gateway documentation follows the project standard."
