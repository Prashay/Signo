Add-Type -AssemblyName System.Drawing
$jpgPath = Join-Path $PSScriptRoot "..\build\icon-artwork.jpg"
if (Test-Path $jpgPath) {
    $img = [System.Drawing.Image]::FromFile($jpgPath)
    $dest1 = Join-Path $PSScriptRoot "..\build\icon.png"
    $dest2 = Join-Path $PSScriptRoot "..\public\icon.png"
    $img.Save($dest1, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Save($dest2, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Host "High-res 1024x1024 PNG icon generated successfully!"
}
