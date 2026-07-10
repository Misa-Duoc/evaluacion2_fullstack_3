$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

try {
    docker info | Out-Null
} catch {
    Write-Error "Docker daemon no esta disponible. Abre Docker Desktop y vuelve a ejecutar este script."
    exit 1
}

# Verifica que exista el .env y que tenga la API key de Groq configurada.
# Si falta, el chat-service arranca igual pero el asistente respondera con un
# error 503 controlado ("no esta configurado todavia").
$envPath = Join-Path $root ".env"
if (-not (Test-Path $envPath)) {
    Write-Warning "No se encontro .env en $root. El chat-service no tendra API key (GROQ_API_KEY)."
    Write-Warning "Copia .env.example a .env y completa tu key gratuita de https://console.groq.com/keys"
} else {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -notmatch "GROQ_API_KEY=\S+") {
        Write-Warning "GROQ_API_KEY parece vacia en .env. El asistente de chat no respondera hasta que la completes."
    }
}

# Baja los contenedores existentes antes de reconstruir. Esto es necesario
# para que Docker Compose relea el .env y recree chat-service con las
# variables de entorno actualizadas (un simple 'up --build' a veces no lo
# recrea si el contenedor ya existia con variables antiguas/vacias).
docker compose down

docker compose up --build -d
docker compose ps

Write-Host ""
Write-Host "Plataforma SmartLogix desplegada en Docker Compose."
Write-Host "Gateway: http://localhost:8080"
Write-Host "Eureka: http://localhost:8761"
Write-Host "Para ver logs: docker compose logs -f api-gateway"
Write-Host "Para verificar la API key del chat: docker compose exec chat-service env | Select-String GROQ"
