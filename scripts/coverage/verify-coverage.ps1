# Verifies curated hotel external_coverage before insertion -- the "hard rule".
#
# Reads <Dir>/cov-<slug>.json files (each {slug, reviews[], videos[]} produced
# by a research subagent -- see README.md), then:
#   - Confirms every YouTube video via the oEmbed endpoint; drops any that
#     404/err, and replaces title/channel with oEmbed's canonical values so a
#     mistyped id can't survive and titles are always exact.
#   - HTTP-checks every review URL; drops only 404s (403/401 are bot-blocks on
#     real pages, kept), warns on timeouts.
#   - Warns on any review summary >240 chars (schema max -- insert will refuse).
# Writes <Dir>/coverage-final.json (cleaned) and prints a drop/warning report.
#
# Usage:  powershell scripts/coverage/verify-coverage.ps1 -Dir <staging-dir>
param([Parameter(Mandatory = $true)][string]$Dir)
$ErrorActionPreference = 'Stop'
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

$files = Get-ChildItem (Join-Path $Dir 'cov-*.json')
$final = [ordered]@{}
$report = @()

foreach ($f in $files) {
  $d = [System.IO.File]::ReadAllText($f.FullName) | ConvertFrom-Json
  $slug = $d.slug
  $keptReviews = @(); $keptVideos = @()

  foreach ($r in $d.reviews) {
    $code = 0
    try {
      $resp = Invoke-WebRequest -Uri $r.url -Method Get -UseBasicParsing -TimeoutSec 20 -UserAgent $ua
      $code = [int]$resp.StatusCode
    } catch {
      $code = -1
      if ($_.Exception.Response) { try { $code = [int]$_.Exception.Response.StatusCode } catch {} }
    }
    if ($code -eq 404) { $report += "DROP review 404: $slug -> $($r.url)"; continue }
    if ($code -eq -1) { $report += "WARN review unchecked (timeout/err): $slug -> $($r.url)" }
    if ($r.summary -and $r.summary.Length -gt 240) { $report += "WARN summary >240 ($($r.summary.Length)): $slug -> $($r.source)" }
    $keptReviews += $r
  }

  foreach ($v in $d.videos) {
    $id = $v.video_id
    $oe = "https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D$id&format=json"
    $okv = $false; $title = $v.title; $channel = $v.channel
    try {
      $j = Invoke-RestMethod -Uri $oe -TimeoutSec 20 -UserAgent $ua
      if ($j.title) { $okv = $true; $title = $j.title; $channel = $j.author_name }
    } catch { $okv = $false }
    if (-not $okv) { $report += "DROP video oEmbed-fail: $slug -> $id"; continue }
    $nv = [ordered]@{ title = $title; channel = $channel; url = "https://www.youtube.com/watch?v=$id"; video_id = $id }
    if ($v.published_date) { $nv.published_date = $v.published_date }
    if ($v.view_count) { $nv.view_count = [int]$v.view_count }
    $keptVideos += [pscustomobject]$nv
  }

  $final[$slug] = [ordered]@{ reviews = $keptReviews; videos = $keptVideos }
  "{0,-40} reviews {1}/{2}  videos {3}/{4}" -f $slug, $keptReviews.Count, $d.reviews.Count, $keptVideos.Count, $d.videos.Count
}

($final | ConvertTo-Json -Depth 12) | Out-File (Join-Path $Dir 'coverage-final.json') -Encoding utf8
"`n--- DROPS / WARNINGS ---"
if ($report.Count -eq 0) { "none" } else { $report | ForEach-Object { $_ } }
