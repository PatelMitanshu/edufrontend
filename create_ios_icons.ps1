# EduLearn iOS Icon Creator PowerShell Script
# This script creates iOS app icons from the logo image

Add-Type -AssemblyName System.Drawing

function Resize-ImageForIOS {
    param(
        [string]$SourcePath,
        [int]$Width,
        [int]$Height
    )
    
    $sourceImage = [System.Drawing.Image]::FromFile($SourcePath)
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Add white background for iOS icons
    $backgroundBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillRectangle($backgroundBrush, 0, 0, $Width, $Height)
    
    # Calculate padding for better logo visibility (10% padding for iOS)
    $padding = [int]($Width * 0.10)
    $logoSize = $Width - (2 * $padding)
    
    # Draw the resized image with padding
    $graphics.DrawImage($sourceImage, $padding, $padding, $logoSize, $logoSize)
    
    $graphics.Dispose()
    $sourceImage.Dispose()
    $backgroundBrush.Dispose()
    return $bitmap
}

# Source logo path
$logoPath = "c:\react_native\educationapp\appfrontend\src\assets\logo.png"

if (!(Test-Path $logoPath)) {
    Write-Host "Logo file not found at: $logoPath" -ForegroundColor Red
    Write-Host "Please make sure the logo file exists before running this script." -ForegroundColor Red
    exit 1
}

# iOS icon sizes
$iosSizes = @(
    @{Name="AppIcon-20@2x"; Size=40},
    @{Name="AppIcon-20@3x"; Size=60},
    @{Name="AppIcon-29@2x"; Size=58},
    @{Name="AppIcon-29@3x"; Size=87},
    @{Name="AppIcon-40@2x"; Size=80},
    @{Name="AppIcon-40@3x"; Size=120},
    @{Name="AppIcon-60@2x"; Size=120},
    @{Name="AppIcon-60@3x"; Size=180},
    @{Name="AppIcon-1024"; Size=1024}
)

$iosIconDir = "ios\ubarcloan\Images.xcassets\AppIcon.appiconset"

Write-Host "Creating iOS app icons from logo..." -ForegroundColor Yellow

foreach ($iconSize in $iosSizes) {
    $icon = Resize-ImageForIOS -SourcePath $logoPath -Width $iconSize.Size -Height $iconSize.Size
    $icon.Save("$iosIconDir\$($iconSize.Name).png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Created $($iconSize.Name).png ($($iconSize.Size)x$($iconSize.Size))" -ForegroundColor Green
    
    $icon.Dispose()
}

Write-Host "iOS app icons created successfully!" -ForegroundColor Green
Write-Host "You can now build and run your iOS app to see the new icons." -ForegroundColor Cyan
