param(
    [string]$OutputPath = (Join-Path $PSScriptRoot 'index.html')
)

$includeFiles = @{
    'css' = 'css.html'
    'Chatbot/Chatbot-css' = 'Chatbot\Chatbot-css.html'
    'PageModules' = 'PageModules.html'
    'supabase' = 'supabase.html'
    'attendance' = 'attendance.html'
    'javascript' = 'javascript.html'
    'Chatbot/Chatbot-js' = 'Chatbot\Chatbot-js.html'
}

$sourcePath = Join-Path $PSScriptRoot 'Routes\Home\page.html'
$html = [System.IO.File]::ReadAllText($sourcePath)
$includePattern = [regex]::new("<\?!=\s*include\('([^']+)'\);\s*\?>")
$html = $includePattern.Replace($html, [System.Text.RegularExpressions.MatchEvaluator]{
    param($match)

    $includeName = $match.Groups[1].Value
    if (-not $includeFiles.ContainsKey($includeName)) {
        throw "Unsupported static include: $includeName"
    }

    $includePath = Join-Path $PSScriptRoot $includeFiles[$includeName]
    if (-not (Test-Path -LiteralPath $includePath -PathType Leaf)) {
        throw "Static include not found: $includePath"
    }

    return [System.IO.File]::ReadAllText($includePath)
})

if ($html -match '<\?') {
    throw 'The generated homepage still contains an unresolved Apps Script template tag.'
}

if (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path $PSScriptRoot $OutputPath
}

$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutputPath, $html, $encoding)
Write-Output "Generated $OutputPath"
