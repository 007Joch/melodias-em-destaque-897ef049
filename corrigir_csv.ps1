# Script para corrigir escape characters no CSV
$inputFile = "cvs-corrigir-rafael\versoes_rows.csv"
$outputFile = "cvs-corrigir-rafael\versoes_rows_corrigido.csv"

# Ler o arquivo
$content = Get-Content $inputFile -Raw -Encoding UTF8

# Corrigir escape characters Unicode usando [regex]::Replace
$content = [regex]::Replace($content, '\\u00e9', 'é')
$content = [regex]::Replace($content, '\\u00e1', 'á')
$content = [regex]::Replace($content, '\\u00e3', 'ã')
$content = [regex]::Replace($content, '\\u00f3', 'ó')
$content = [regex]::Replace($content, '\\u00ea', 'ê')
$content = [regex]::Replace($content, '\\u00e7', 'ç')
$content = [regex]::Replace($content, '\\u00ed', 'í')
$content = [regex]::Replace($content, '\\u00fa', 'ú')
$content = [regex]::Replace($content, '\\u00f4', 'ô')
$content = [regex]::Replace($content, '\\u00e0', 'à')
$content = [regex]::Replace($content, '\\u00f5', 'õ')
$content = [regex]::Replace($content, '\\u00fc', 'ü')
$content = [regex]::Replace($content, '\\u00e2', 'â')
$content = [regex]::Replace($content, '\\u00f1', 'ñ')
$content = [regex]::Replace($content, '\\u00a0', ' ')

# Corrigir tags HTML com escape
$content = [regex]::Replace($content, '<\\/div>', '</div>')
$content = [regex]::Replace($content, '<\\/i>', '</i>')
$content = [regex]::Replace($content, '<\\/b>', '</b>')
$content = [regex]::Replace($content, '<\\/p>', '</p>')
$content = [regex]::Replace($content, '<\\/br>', '</br>')

# Salvar o arquivo corrigido
Set-Content $outputFile $content -Encoding UTF8

Write-Host "Arquivo corrigido salvo como: $outputFile"