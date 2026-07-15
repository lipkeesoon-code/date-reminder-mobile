$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 1. 用绝对完整路径读取图片
$imgPath = Join-Path (Get-Location) "*" | Get-ChildItem | Where-Object { $_.Name -like "*Metal Slug Multiply80*" }
if (-not $imgPath) {
    $allPng = Get-ChildItem -Recurse -Filter "*.png" | Where-Object { $_.Name -like "*Metal Slug Multiply80*" }
    $imgPath = $allPng | Select-Object -First 1
}
Write-Output "Image path: $($imgPath.FullName)"

$bytes  = [System.IO.File]::ReadAllBytes($imgPath.FullName)
$base64 = [System.Convert]::ToBase64String($bytes)
$dataURL = "data:image/png;base64," + $base64
Write-Output "Base64 length: $($base64.Length)"

# 2. 读取 script.js
$script = [System.IO.File]::ReadAllText("script.js", $utf8NoBom)
Write-Output "Script length before: $($script.Length)"

# 3. 在第一行前面插入 metalSlugDataURL 变量
$script = "let metalSlugDataURL = '" + $dataURL + "';" + "`r`n" + $script

# 4. 找到 today 区块并插入吉祥物
$oldToday = "            cell.classList.add(`"today`");`r`n        }"
$newToday = "            cell.classList.add(`"today`");`r`n            if (typeof metalSlugDataURL !== 'undefined') {`r`n                const mascotImg = document.createElement('img');`r`n                mascotImg.src = metalSlugDataURL;`r`n                mascotImg.className = 'today-mascot';`r`n                mascotImg.alt = '';`r`n                cell.appendChild(mascotImg);`r`n            }`r`n        }"

if ($script.Contains($oldToday)) {
    $script = $script.Replace($oldToday, $newToday)
    Write-Output "today block patched: TRUE"
} else {
    Write-Output "today block NOT FOUND - checking line endings..."
    # try LF only
    $oldTodayLF = "            cell.classList.add(`"today`");`n        }"
    $newTodayLF = "            cell.classList.add(`"today`");`n            if (typeof metalSlugDataURL !== 'undefined') {`n                const mascotImg = document.createElement('img');`n                mascotImg.src = metalSlugDataURL;`n                mascotImg.className = 'today-mascot';`n                mascotImg.alt = '';`n                cell.appendChild(mascotImg);`n            }`n        }"
    if ($script.Contains($oldTodayLF)) {
        $script = $script.Replace($oldTodayLF, $newTodayLF)
        Write-Output "today block patched with LF: TRUE"
    } else {
        Write-Output "ERROR: today block still not found!"
    }
}

# 5. 写回
[System.IO.File]::WriteAllText("script.js", $script, $utf8NoBom)
Write-Output "Script length after: $($script.Length)"
Write-Output "=== DONE ==="
