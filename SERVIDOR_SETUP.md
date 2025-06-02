
# Setup do Servidor Backend - Grid Trading Bot

Este documento detalha como inicializar e configurar o servidor backend em sistemas Linux e Windows.

## Pré-requisitos

### Software Necessário
- **Python 3.8+** (recomendado Python 3.9 ou superior)
- **pip** (gerenciador de pacotes Python)
- **Git** (opcional, para clonar repositório)

### Dependências Python Essenciais
```bash
fastapi>=0.104.0
uvicorn>=0.24.0
python-binance>=1.0.19
pandas>=1.5.0
numpy>=1.24.0
asyncio-mqtt>=0.13.0
websockets>=11.0.0
python-dotenv>=1.0.0
pydantic>=2.5.0
httpx>=0.25.0
onnxruntime>=1.16.0  # Para RL
scikit-learn>=1.3.0  # Para indicadores técnicos
ta>=0.10.2  # Biblioteca de análise técnica
```

---

## Setup no Linux (Ubuntu/Debian)

### 1. Instalação do Python e Pip
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3.9+
sudo apt install python3.9 python3.9-pip python3.9-venv -y

# Verificar versão
python3.9 --version
```

### 2. Criação do Ambiente Virtual
```bash
# Navegar para diretório do projeto
cd /caminho/para/projeto

# Criar ambiente virtual
python3.9 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate

# Atualizar pip
pip install --upgrade pip
```

### 3. Instalação das Dependências
```bash
# Instalar dependências básicas
pip install fastapi uvicorn python-binance pandas numpy python-dotenv pydantic httpx

# Instalar bibliotecas de análise técnica
pip install ta scikit-learn

# Instalar ONNX para RL (opcional)
pip install onnxruntime

# Instalar WebSocket support
pip install websockets asyncio-mqtt

# Para desenvolvimento (opcional)
pip install pytest black flake8
```

### 4. Configuração das Variáveis de Ambiente
```bash
# Criar arquivo .env
nano .env

# Adicionar configurações:
BINANCE_API_KEY=sua_api_key_aqui
BINANCE_SECRET_KEY=sua_secret_key_aqui
ENVIRONMENT=production
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["http://localhost:3000", "https://seu-frontend.com"]
```

### 5. Estrutura de Diretórios Recomendada
```bash
mkdir -p {logs,models,data,config}
touch {main.py,requirements.txt}
```

### 6. Inicialização do Servidor
```bash
# Método 1: Usando uvicorn diretamente
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Método 2: Script de inicialização
./start_server.sh

# Método 3: Como serviço systemd (produção)
sudo systemctl start gridbot-api
sudo systemctl enable gridbot-api
```

### 7. Script de Inicialização (start_server.sh)
```bash
#!/bin/bash
# Criar arquivo start_server.sh

echo "Iniciando Grid Trading Bot Server..."

# Ativar ambiente virtual
source venv/bin/activate

# Verificar dependências
python -c "import fastapi, uvicorn, binance; print('Dependências OK')"

# Verificar configuração
if [ ! -f .env ]; then
    echo "ERRO: Arquivo .env não encontrado!"
    exit 1
fi

# Iniciar servidor
uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --log-level info \
    --access-log

# Tornar executável
chmod +x start_server.sh
```

---

## Setup no Windows

### 1. Instalação do Python
```powershell
# Baixar Python do site oficial: https://python.org
# Durante instalação, marcar "Add Python to PATH"

# Verificar instalação
python --version
pip --version
```

### 2. Criação do Ambiente Virtual
```powershell
# Navegar para diretório do projeto
cd C:\caminho\para\projeto

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
venv\Scripts\activate

# Atualizar pip
python -m pip install --upgrade pip
```

### 3. Instalação das Dependências
```powershell
# Instalar dependências via pip
pip install fastapi uvicorn python-binance pandas numpy python-dotenv pydantic httpx

# Bibliotecas de análise técnica
pip install ta scikit-learn

# ONNX para RL
pip install onnxruntime

# WebSocket support
pip install websockets asyncio-mqtt
```

### 4. Configuração das Variáveis de Ambiente
```powershell
# Criar arquivo .env no diretório do projeto
notepad .env

# Conteúdo do arquivo:
BINANCE_API_KEY=sua_api_key_aqui
BINANCE_SECRET_KEY=sua_secret_key_aqui
ENVIRONMENT=production
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
```

### 5. Inicialização do Servidor
```powershell
# Ativar ambiente virtual
venv\Scripts\activate

# Iniciar servidor
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Ou usando Python diretamente
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Script BAT para Windows (start_server.bat)
```batch
@echo off
echo Iniciando Grid Trading Bot Server...

REM Ativar ambiente virtual
call venv\Scripts\activate

REM Verificar dependências
python -c "import fastapi, uvicorn, binance; print('Dependencias OK')"
if errorlevel 1 (
    echo ERRO: Dependencias nao encontradas!
    pause
    exit /b 1
)

REM Verificar arquivo .env
if not exist .env (
    echo ERRO: Arquivo .env nao encontrado!
    pause
    exit /b 1
)

REM Iniciar servidor
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info

pause
```

---

## Configuração Avançada

### 1. Configuração como Serviço (Linux)
```bash
# Criar arquivo de serviço
sudo nano /etc/systemd/system/gridbot-api.service

# Conteúdo:
[Unit]
Description=Grid Trading Bot API
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/projeto
Environment=PATH=/caminho/para/projeto/venv/bin
ExecStart=/caminho/para/projeto/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target

# Ativar serviço
sudo systemctl daemon-reload
sudo systemctl enable gridbot-api
sudo systemctl start gridbot-api
```

### 2. Configuração com Docker
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  gridbot-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - BINANCE_API_KEY=${BINANCE_API_KEY}
      - BINANCE_SECRET_KEY=${BINANCE_SECRET_KEY}
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
```

### 3. Configuração com Nginx (Proxy Reverso)
```nginx
# /etc/nginx/sites-available/gridbot-api
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## Verificação e Troubleshooting

### 1. Verificar se o servidor está rodando
```bash
# Linux/Mac
curl http://localhost:8000/api/status

# Windows (PowerShell)
Invoke-RestMethod http://localhost:8000/api/status
```

### 2. Logs e Debugging
```bash
# Ver logs em tempo real (Linux)
tail -f logs/gridbot.log

# Verificar processos
ps aux | grep uvicorn

# Verificar portas em uso
netstat -tulpn | grep :8000
```

### 3. Problemas Comuns
- **Porta em uso**: Mudar porta ou matar processo existente
- **Dependências**: Reinstalar com `pip install --force-reinstall`
- **Permissões**: Verificar permissões de arquivo e diretório
- **Firewall**: Abrir porta 8000 no firewall

### 4. Monitoramento
```bash
# Usar htop para monitorar recursos
htop

# Logs de sistema (Linux)
journalctl -u gridbot-api -f

# Status do serviço
systemctl status gridbot-api
```

---

## Endpoints que devem estar implementados

O servidor deve responder aos seguintes endpoints conforme a documentação:

- `GET /api/status` - Status do backend
- `GET /api/trading/pairs` - Pares de trading ativos
- `GET /api/market_data` - Dados de mercado (fallback)
- `GET /api/klines/{symbol}` - Validação de pares
- `GET /api/balance/summary` - Resumo de saldo
- `POST /api/grid/start` - Iniciar bot
- `POST /api/grid/stop` - Parar bot
- `GET /api/grid/status/{symbol}` - Status do bot
- `GET /api/rl/status` - Status do RL
- `GET /api/trades/{symbol}` - Execuções de trades
- `GET /api/rl/training_status` - Status de treinamento
- `GET /api/indicators/list` - Lista de indicadores
- `GET /api/indicators/{symbol}` - Dados de indicador
- `GET /api/recommended_pairs` - Pares recomendados

Certifique-se de que todos os endpoints estão implementados e retornam os formatos de dados esperados pelo frontend.
