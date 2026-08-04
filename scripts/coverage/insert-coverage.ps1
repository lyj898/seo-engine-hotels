# Inserts verified external_coverage (from verify-coverage.ps1's
# coverage-final.json) into each hotel entity JSON, immediately before its
# "tags" line, preserving the file's existing formatting and line endings.
# Skips entities that already have external_coverage. Refuses any review
# summary >240 chars (schema max). Validates each file still parses after
# insertion before writing.
#
# Usage:  powershell scripts/coverage/insert-coverage.ps1 -Dir <staging-dir>
param([Parameter(Mandatory = $true)][string]$Dir)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$cov = [System.IO.File]::ReadAllText((Join-Path $Dir 'coverage-final.json')) | ConvertFrom-Json

# JSON string escape that keeps non-ASCII (accents, &, emoji) literal to match
# the hand-written house style; only escapes what JSON strictly requires.
function Esc($s) {
  if ($null -eq $s) { return '' }
  $s = [string]$s
  $s = $s -replace '\\', '\\'
  $s = $s -replace '"', '\"'
  $s = $s -replace "`r", ''
  $s = $s -replace "`n", '\n'
  $s = $s -replace "`t", '\t'
  return $s
}
# Build one object's block. $fields = ordered @(@(key,value,isNumber), ...).
function ObjBlock($fields, $ind) {
  $lines = @()
  foreach ($f in $fields) {
    $k = $f[0]; $v = $f[1]; $isNum = $f[2]
    if ($null -eq $v -or ($v -is [string] -and $v -eq '')) { continue }
    if ($isNum) { $lines += "$ind  `"$k`": $v" }
    else { $lines += "$ind  `"$k`": `"$(Esc $v)`"" }
  }
  return "$ind{`n" + ($lines -join ",`n") + "`n$ind}"
}

$applied = 0; $skipped = 0; $problems = @()

foreach ($p in $cov.PSObject.Properties) {
  $slug = $p.Name
  $file = Join-Path $repo "data\entities\$slug.json"
  if (-not (Test-Path $file)) { $problems += "no file: $slug"; continue }
  $raw = [System.IO.File]::ReadAllText($file)
  if ($raw -match '"external_coverage"') { $skipped++; continue }
  $nl = if ($raw -match "`r`n") { "`r`n" } else { "`n" }

  $tooLong = $p.Value.reviews | Where-Object { $_.summary.Length -gt 240 }
  if ($tooLong) { $problems += ("{0}: {1} review summary(ies) >240 chars -- shorten before inserting" -f $slug, $tooLong.Count); continue }

  $reviewBlocks = @()
  foreach ($r in $p.Value.reviews) {
    $reviewBlocks += ObjBlock @(
      @('title', $r.title, $false), @('source', $r.source, $false), @('author', $r.author, $false),
      @('url', $r.url, $false), @('published_date', $r.published_date, $false), @('summary', $r.summary, $false)
    ) '      '
  }
  $videoBlocks = @()
  foreach ($v in $p.Value.videos) {
    $videoBlocks += ObjBlock @(
      @('title', $v.title, $false), @('channel', $v.channel, $false), @('url', $v.url, $false),
      @('video_id', $v.video_id, $false), @('published_date', $v.published_date, $false), @('view_count', $v.view_count, $true)
    ) '      '
  }

  $block =
    '  "external_coverage": {' + $nl +
    '    "reviews": [' + $nl + (($reviewBlocks -join (',' + $nl)) -replace "`n", $nl) + $nl + '    ],' + $nl +
    '    "videos": [' + $nl + (($videoBlocks -join (',' + $nl)) -replace "`n", $nl) + $nl + '    ]' + $nl +
    '  },' + $nl

  $marker = '  "tags":'
  $idx = $raw.IndexOf($marker)
  if ($idx -lt 0) { $problems += "no tags marker: $slug"; continue }
  $new = $raw.Substring(0, $idx) + $block + $raw.Substring($idx)
  try { $null = $new | ConvertFrom-Json } catch { $problems += "PARSE FAIL after insert: $slug -> $($_.Exception.Message)"; continue }

  [System.IO.File]::WriteAllText($file, $new, (New-Object System.Text.UTF8Encoding($false)))
  $applied++
}

"applied: $applied  skipped(existing): $skipped"
if ($problems.Count) { "PROBLEMS:"; $problems } else { "no problems" }
