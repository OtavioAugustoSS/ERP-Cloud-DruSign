# tunnel.ps1 — Inicia o Cloudflare Tunnel e configura o Next.js automaticamente
# Uso: ./tunnel.ps1
# Requisito: cloudflared instalado (ja esta instalado)

$PORT = 4000
$ENV_FILE = ".env"
$LOG_FILE = "tunnel.log"

Write-Host ""
Write-Host "DruSign — Demo Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando tunnel na porta $PORT..." -ForegroundColor Yellow
Write-Host "(aguarde ate a URL aparecer)" -ForegroundColor DarkGray
Write-Host ""

# Inicia o cloudflared em background e captura o log
$job = Start-Job -ScriptBlock {
    param($port, $log)
    & cloudflared tunnel --url "http://localhost:$port" 2>&1 | Tee-Object -FilePath $log
} -ArgumentList $PORT, $LOG_FILE

# Aguarda a URL aparecer no log (ate 30 segundos)
$url = $null
$tries = 0
while (-not $url -and $tries -lt 60) {
    Start-Sleep -Milliseconds 500
    $tries++
    if (Test-Path $LOG_FILE) {
        $content = Get-Content $LOG_FILE -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-z0-9\-]+\.trycloudflare\.com') {
            $url = $matches[0]
        }
    }
}

if (-not $url) {
    Write-Host "Erro: URL do tunnel nao foi capturada. Verifique se o cloudflared esta funcionando." -ForegroundColor Red
    Stop-Job $job
    Remove-Job $job
    exit 1
}

# Atualiza o .env com o TUNNEL_ORIGIN
$envContent = Get-Content $ENV_FILE -Raw
if ($envContent -match 'TUNNEL_ORIGIN=.*') {
    $envContent = $envContent -replace 'TUNNEL_ORIGIN=.*', "TUNNEL_ORIGIN=$url"
} else {
    $envContent = $envContent.TrimEnd() + "`nTUNNEL_ORIGIN=$url`n"
}
Set-Content $ENV_FILE $envContent -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "Tunnel ativo!" -ForegroundColor Green
Write-Host ""
Write-Host "URL publica:" -ForegroundColor White
Write-Host "  $url" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor White
Write-Host "  1. Reinicie o servidor dev: npm run dev" -ForegroundColor DarkGray
Write-Host "  2. Compartilhe a URL acima com quem precisar ver o sistema" -ForegroundColor DarkGray
Write-Host "  3. A URL fica ativa enquanto este terminal estiver aberto" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Pressione Ctrl+C para encerrar o tunnel." -ForegroundColor DarkGray
Write-Host ""

# Mantém o tunnel vivo ate Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 5
        # Verifica se o job ainda esta rodando
        if ((Get-Job $job.Id).State -ne 'Running') {
            Write-Host "Tunnel encerrado inesperadamente." -ForegroundColor Red
            break
        }
    }
} finally {
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
    # Limpa o TUNNEL_ORIGIN do .env ao encerrar
    $envContent = Get-Content $ENV_FILE -Raw
    $envContent = $envContent -replace "`nTUNNEL_ORIGIN=.*", ""
    Set-Content $ENV_FILE $envContent -Encoding utf8 -NoNewline
    if (Test-Path $LOG_FILE) { Remove-Item $LOG_FILE -Force }
    Write-Host "Tunnel encerrado. URL removida do .env." -ForegroundColor Yellow
}
