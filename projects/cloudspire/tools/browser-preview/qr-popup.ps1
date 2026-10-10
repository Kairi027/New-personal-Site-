# qr-popup.ps1 - Show a QR code PNG in a small always-on-top window.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File qr-popup.ps1 -ImagePath <png> -LinkText <url>
param(
    [Parameter(Mandatory = $true)]
    [string]$ImagePath,

    [string]$LinkText = ''
)

$ErrorActionPreference = 'Stop'

try {
    if (-not [System.IO.Path]::IsPathRooted($ImagePath)) {
        $ImagePath = [System.IO.Path]::GetFullPath($ImagePath)
    }
    if (-not (Test-Path -LiteralPath $ImagePath -PathType Leaf)) {
        Write-Error "Image not found: $ImagePath"
        exit 1
    }

    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $img = [System.Drawing.Image]::FromFile($ImagePath)

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'Cloudspire QR'
    $form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedToolWindow
    $form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
    $form.TopMost = $true
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.ShowInTaskbar = $true

    $MAX = 500
    $w = $img.Width
    $h = $img.Height
    $ratio = [Math]::Min(1.0, [Math]::Min($MAX / [double]$w, $MAX / [double]$h))
    $w = [int]($w * $ratio)
    $h = [int]($h * $ratio)

    $pb = New-Object System.Windows.Forms.PictureBox
    $pb.Image = $img
    $pb.SizeMode = [System.Windows.Forms.PictureBoxSizeMode]::Zoom
    $pb.Width = $w
    $pb.Height = $h
    $pb.Location = New-Object System.Drawing.Point -ArgumentList 12, 12

    $labelHeight = 0
    if (-not [string]::IsNullOrEmpty($LinkText)) {
        $label = New-Object System.Windows.Forms.Label
        $label.Text = $LinkText
        $label.Font = $form.Font
        $label.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
        $label.ForeColor = [System.Drawing.Color]::DimGray
        $label.AutoSize = $true
        $label.MaximumSize = New-Object System.Drawing.Size -ArgumentList $w, 0
        $label.Location = New-Object System.Drawing.Point -ArgumentList 12, (12 + $h + 6)
        $labelHeight = $label.PreferredHeight
        $form.Controls.Add($label)
    }

    $form.Controls.Add($pb)
    $form.ClientSize = New-Object System.Drawing.Size -ArgumentList ($w + 24), (12 + $h + 6 + $labelHeight + 12)
    $form.Add_Shown({ $form.Activate() })
    [void]$form.ShowDialog()

    $pb.Image = $null
    $img.Dispose()
    $form.Dispose()
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}