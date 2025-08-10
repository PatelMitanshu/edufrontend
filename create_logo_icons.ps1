# EduLearn Logo Icon Creator PowerShell Script
# This script creates app icons from the new logo image

Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$SourcePath,
        [int]$Width,
        [int]$Height,
        [bool]$IsRound = $false
    )
    
    $sourceImage = [System.Drawing.Image]::FromFile($SourcePath)
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Add background for better visibility
    $backgroundBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillRectangle($backgroundBrush, 0, 0, $Width, $Height)
    
    if ($IsRound) {
        # Create circular clipping path
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $Width, $Height)
        $graphics.SetClip($path)
        
        # Less padding for round icons to make logo more prominent
        $padding = [int]($Width * 0.10)
    } else {
        # More padding for square icons
        $padding = [int]($Width * 0.15)
    }
    
    $logoSize = $Width - (2 * $padding)
    
    # Draw the resized image with calculated padding
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

# Create icons for all densities
$densities = @(
    @{Name="mdpi"; Size=48},
    @{Name="hdpi"; Size=72}, 
    @{Name="xhdpi"; Size=96},
    @{Name="xxhdpi"; Size=144},
    @{Name="xxxhdpi"; Size=192}
)

Write-Host "Creating app icons from logo..." -ForegroundColor Yellow

foreach ($density in $densities) {
    $dirPath = "android\app\src\main\res\mipmap-$($density.Name)"
    
    if (!(Test-Path $dirPath)) {
        New-Item -ItemType Directory -Force -Path $dirPath | Out-Null
    }
    
    # Create square icon
    $squareIcon = Resize-Image -SourcePath $logoPath -Width $density.Size -Height $density.Size -IsRound $false
    $squareIcon.Save("$dirPath\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Create round icon
    $roundIcon = Resize-Image -SourcePath $logoPath -Width $density.Size -Height $density.Size -IsRound $true
    $roundIcon.Save("$dirPath\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Created icons for $($density.Name) ($($density.Size)x$($density.Size))" -ForegroundColor Green
    
    $squareIcon.Dispose()
    $roundIcon.Dispose()
}

Write-Host "Logo-based app icons created successfully!" -ForegroundColor Green
Write-Host "You can now build and run your app to see the new icons." -ForegroundColor Cyan
