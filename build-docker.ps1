# ==========================================
# Build Frontend Docker Image - Local Testing
# ==========================================

param(
    [string]$Registry = "yourusername",
    [string]$Version = "latest",
    [switch]$Push = $false
)

Write-Host "🐳 Building StockMonitorAgent Frontend Docker Image" -ForegroundColor Cyan
Write-Host "Registry: $Registry" -ForegroundColor Yellow
Write-Host "Version: $Version" -ForegroundColor Yellow
Write-Host ""

# Cargar variables de entorno desde .env.production si existe
if (Test-Path ".env.production") {
    Write-Host "📄 Loading .env.production..." -ForegroundColor Yellow
    Get-Content .env.production | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Frontend
Write-Host "📦 Building Frontend Image..." -ForegroundColor Green

$apiUrl = $env:VITE_API_URL ?? "https://api.stockmonitor.app"
$signalrUrl = $env:VITE_SIGNALR_HUB_URL ?? "https://api.stockmonitor.app/hubs/alerts"
$stripeKey = $env:VITE_STRIPE_PUBLISHABLE_KEY ?? "pk_test_placeholder"

docker build -f Dockerfile.prod `
    --build-arg VITE_API_URL=$apiUrl `
    --build-arg VITE_SIGNALR_HUB_URL=$signalrUrl `
    --build-arg VITE_STRIPE_PUBLISHABLE_KEY=$stripeKey `
    -t "${Registry}/stockmonitor-frontend:${Version}" `
    -t "${Registry}/stockmonitor-frontend:latest" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend image built successfully!" -ForegroundColor Green
Write-Host ""

# Mostrar imágenes creadas
Write-Host "📋 Docker Images:" -ForegroundColor Cyan
docker images | Select-String "stockmonitor-frontend"

if ($Push) {
    Write-Host ""
    Write-Host "⬆️  Pushing images to registry..." -ForegroundColor Yellow
    docker push "${Registry}/stockmonitor-frontend:${Version}"
    docker push "${Registry}/stockmonitor-frontend:latest"
    Write-Host "✅ Images pushed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Build completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test locally: docker run -p 3000:80 ${Registry}/stockmonitor-frontend:${Version}" -ForegroundColor White
Write-Host "  2. Push to registry: .\build-docker.ps1 -Push" -ForegroundColor White
Write-Host "  3. Deploy to production server" -ForegroundColor White
