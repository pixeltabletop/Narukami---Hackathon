# Genera la voz en off del video y mide cuanto dura de verdad.
#
# La tabla de duracion del guion se calcula a 160 palabras por minuto, que es
# una conjetura. Lo que decide si el video cabe en el limite del reto es cuanto
# dura el audio que de verdad se sintetizo, asi que este script mide la cabecera
# de cada WAV en vez de estimar.
#
# El texto NO se duplica aqui: se lee de docs/GUION-VIDEO.md, que es el guion
# auditado. Copiarlo a un segundo lugar garantizaria que algun dia digan cosas
# distintas.
param(
    [string]$Voz = 'Microsoft Sabina',   # alternativa masculina: 'Microsoft Raul'
    [int]$Ritmo = 0,                     # -10 a 10; 0 es el ritmo natural
    [string]$Guion = 'docs/GUION-VIDEO.md',
    [string]$Salida = 'audio/locucion'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

# --- Leer la locucion de cada bloque del guion ---
$lineas = Get-Content -LiteralPath $Guion -Encoding UTF8
$bloques = [System.Collections.Generic.List[object]]::new()
$titulo = $null
$enLocucion = $false
for ($i = 0; $i -lt $lineas.Count; $i++) {
    $l = $lineas[$i]
    if ($l -match '^## Bloque\s+(\d+)') {
        $titulo = $Matches[1]
        $enLocucion = $false
        continue
    }
    if ($l -match '^### LOCUCI') { $enLocucion = $true; continue }
    if ($l -match '^###|^## ') { $enLocucion = $false; continue }
    if ($enLocucion -and $l.Trim()) {
        $bloques.Add([pscustomobject]@{ Numero = [int]$titulo; Texto = $l.Trim() })
        $enLocucion = $false
    }
}
if ($bloques.Count -eq 0) { throw "No encontre ninguna locucion en $Guion" }
Write-Host ("Bloques leidos del guion: {0}" -f $bloques.Count)

# --- Sintetizar ---
New-Item -ItemType Directory -Force -Path $Salida | Out-Null
Get-ChildItem -Path $Salida -Filter 'bloque-*.wav' -ErrorAction SilentlyContinue | Remove-Item -Force
$formato = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
    44100, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
    [System.Speech.AudioFormat.AudioChannel]::Mono)

foreach ($b in $bloques) {
    # Las comillas tipograficas y los acentos graves del Markdown se leen en voz
    # alta como ruido si se dejan.
    $texto = $b.Texto -replace '[`*_]', '' -replace '[“”]', '' -replace '[«»]', ''
    $archivo = Join-Path $Salida ("bloque-{0}.wav" -f $b.Numero)
    # Ojo: PowerShell no distingue mayusculas, asi que este objeto no se puede
    # llamar $voz sin pisar al parametro $Voz que trae el nombre de la voz.
    $sintetizador = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $sintetizador.SelectVoice($Voz)
    $sintetizador.Rate = $Ritmo
    $sintetizador.SetOutputToWaveFile($archivo, $formato)
    $sintetizador.Speak($texto)
    $sintetizador.Dispose()
}

# --- Medir la duracion real, leyendo la cabecera de cada WAV ---
function Get-DuracionWav([string]$ruta) {
    $bytes = [System.IO.File]::ReadAllBytes($ruta)
    $byteRate = [BitConverter]::ToUInt32($bytes, 28)
    # El bloque de datos no siempre empieza en 44: se busca la marca 'data'.
    $pos = 12
    while ($pos -lt $bytes.Length - 8) {
        $id = [System.Text.Encoding]::ASCII.GetString($bytes, $pos, 4)
        $tam = [BitConverter]::ToUInt32($bytes, $pos + 4)
        if ($id -eq 'data') { return [double]$tam / $byteRate }
        $pos += 8 + $tam + ($tam % 2)
    }
    throw "No encontre el bloque de datos en $ruta"
}
$mmss = { param($s) '{0}:{1:d2}' -f [int][math]::Floor($s / 60), [int][math]::Round($s % 60) }

Write-Host ''
Write-Host ("Voz: {0} | ritmo {1}" -f $Voz, $Ritmo)
Write-Host '| Bloque | Palabras | Duracion | Acumulado |'
Write-Host '| --- | ---: | ---: | ---: |'
$total = 0.0
foreach ($b in $bloques) {
    $archivo = Join-Path $Salida ("bloque-{0}.wav" -f $b.Numero)
    $d = Get-DuracionWav $archivo
    $total += $d
    $palabras = ($b.Texto -split '\s+').Count
    Write-Host ('| {0} | {1} | {2} | {3} |' -f $b.Numero, $palabras, (& $mmss $d), (& $mmss $total))
}
Write-Host ('| **Total** | | **{0}** | |' -f (& $mmss $total))
Write-Host ''
if ($total -gt 210) {
    Write-Host ("PASADO DEL OBJETIVO: {0} de locucion, el tope es 3:30. Hay que recortar {1} s." -f (& $mmss $total), [int][math]::Ceiling($total - 200)) -ForegroundColor Yellow
} elseif ($total -lt 170) {
    Write-Host ("Corto: {0}. Cabe de sobra, se puede dar mas aire a la explicacion." -f (& $mmss $total)) -ForegroundColor Cyan
} else {
    Write-Host ("Dentro del objetivo: {0} de locucion." -f (& $mmss $total)) -ForegroundColor Green
}
