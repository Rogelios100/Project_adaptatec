$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$JavaCC = Join-Path $Root 'resources\javacc.jar'
$Grammar = Join-Path $Root 'compilador\Parser.jj'
$Generated = Join-Path $Root 'build\generated'
$Classes = Join-Path $Root 'build\classes'

if (-not (Test-Path $JavaCC)) {
    throw "No se encontró JavaCC en $JavaCC"
}

Remove-Item $Generated, $Classes -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Generated, $Classes | Out-Null

& java -cp $JavaCC javacc "-OUTPUT_DIRECTORY=$Generated" $Grammar
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Main = Join-Path $Root 'main'
Copy-Item (Join-Path $Generated '*.java') $Main -Force
$GeneratedSources = @(Get-ChildItem $Main -Filter '*.java' -File) + @(Get-ChildItem (Join-Path $Root 'control') -Filter 'erroresS.java' -File)
& javac -encoding UTF-8 -d $Classes ($GeneratedSources.FullName)
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$ApplicationSources = @(Get-ChildItem $Main -Filter 'Main.java' -File) + @(Get-ChildItem (Join-Path $Root 'control') -Filter '*.java' -File) + @(Get-ChildItem (Join-Path $Root 'ui') -Filter '*.java' -File)
& javac -encoding UTF-8 -implicit:none -cp $Classes -d $Classes ($ApplicationSources.FullName)
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Remove-Item $Generated -Recurse -Force
Write-Output "Lexer generado y compilado en $Classes"