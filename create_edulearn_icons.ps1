# EduLearn Icon Creator PowerShell Script
# This script creates simple EduLearn icons for Android

Add-Type -AssemblyName System.Drawing

function Create-EduLearnIcon {
    param(
        [int]$Size,
        [bool]$IsRound = $false
    )
    
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Background
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($Size, $Size),
        [System.Drawing.Color]::FromArgb(255, 0, 123, 255),  # #007BFF
        [System.Drawing.Color]::FromArgb(255, 0, 86, 179)    # #0056B3
    )
    
    if ($IsRound) {
        $graphics.FillEllipse($brush, 0, 0, $Size, $Size)
    } else {
        $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
        $graphics.FillRectangle($brush, $rect)
    }
    
    # Book (white rectangle)
    $bookWidth = [int]($Size * 0.5)
    $bookHeight = [int]($Size * 0.35)
    $bookX = [int](($Size - $bookWidth) / 2)
    $bookY = [int](($Size - $bookHeight) / 2)
    
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $bookRect = New-Object System.Drawing.Rectangle($bookX, $bookY, $bookWidth, $bookHeight)
    $graphics.FillRectangle($whiteBrush, $bookRect)
    
    # Book binding (left edge)
    $bindingWidth = [int]($bookWidth * 0.1)
    $lightBlueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 227, 242, 253))
    $bindingRect = New-Object System.Drawing.Rectangle($bookX, $bookY, $bindingWidth, $bookHeight)
    $graphics.FillRectangle($lightBlueBrush, $bindingRect)
    
    # Book lines
    $bluePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 123, 255), 2)
    $lineStartX = $bookX + [int]($bookWidth * 0.15)
    $lineEndX = $bookX + [int]($bookWidth * 0.9)
    $lineSpacing = [int]($bookHeight / 5)
    
    for ($i = 1; $i -le 3; $i++) {
        $y = $bookY + ($lineSpacing * $i)
        $graphics.DrawLine($bluePen, $lineStartX, $y, $lineEndX, $y)
    }
    
    # Simple "E" for EduLearn
    $font = New-Object System.Drawing.Font("Arial", [int]($Size * 0.12), [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $textX = [int]($Size * 0.75)
    $textY = [int]($Size * 0.75)
    $graphics.DrawString("E", $font, $textBrush, $textX, $textY)
    
    $graphics.Dispose()
    return $bitmap
}

# Create icons for all densities
$densities = @(
    @{Name="mdpi"; Size=48},
    @{Name="hdpi"; Size=72}, 
    @{Name="xhdpi"; Size=96},
    @{Name="xxhdpi"; Size=144},
    @{Name="xxxhdpi"; Size=192}
)

foreach ($density in $densities) {
    $dirPath = "android\app\src\main\res\mipmap-$($density.Name)"
    
    if (!(Test-Path $dirPath)) {
        New-Item -ItemType Directory -Force -Path $dirPath | Out-Null
    }
    
    # Create square icon
    $squareIcon = Create-EduLearnIcon -Size $density.Size -IsRound $false
    $squareIcon.Save("$dirPath\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Create round icon
    $roundIcon = Create-EduLearnIcon -Size $density.Size -IsRound $true
    $roundIcon.Save("$dirPath\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Created icons for $($density.Name) ($($density.Size)x$($density.Size))"
    
    $squareIcon.Dispose()
    $roundIcon.Dispose()
}

Write-Host "EduLearn app icons created successfully!" -ForegroundColor Green
