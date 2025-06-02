
# Dicas de Integração Backend - Grid Trading Bot

Este documento fornece orientações específicas para implementar os endpoints no backend Python.

---

## 1. Estrutura Básica do FastAPI

```python
# main.py - Estrutura básica
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="Grid Trading Bot API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://seu-frontend.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class GridConfig(BaseModel):
    market_type: str
    initial_levels: int
    leverage: Optional[int] = 1
    initial_spacing_perc: str

class BotStatus(BaseModel):
    status: str
    symbol: Optional[str] = None
    market_type: Optional[str] = None
    current_price: Optional[float] = None
    grid_levels: Optional[int] = None
    active_orders: Optional[int] = None
    total_trades: Optional[int] = None
    realized_pnl: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    message: Optional[str] = None
```

---

## 2. Implementação dos Endpoints Essenciais

### Status do Backend
```python
@app.get("/api/status")
async def get_status():
    return {"status": "ok"}
```

### Pares de Trading
```python
from binance.client import Client

@app.get("/api/trading/pairs")
async def get_trading_pairs():
    try:
        client = Client(api_key, api_secret)
        ticker = client.get_ticker()
        
        # Filtrar apenas pares USDT com volume > threshold
        pairs = []
        for t in ticker:
            if t['symbol'].endswith('USDT') and float(t['volume']) > 1000000:
                pairs.append({
                    "symbol": t['symbol'],
                    "price": t['lastPrice'],
                    "volume": t['volume'],
                    "change_24h": t['priceChangePercent']
                })
        
        return sorted(pairs, key=lambda x: float(x['volume']), reverse=True)[:50]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Validação de Pares Customizados
```python
@app.get("/api/klines/{symbol}")
async def validate_pair(symbol: str, limit: int = 1, market_type: str = "spot"):
    try:
        client = Client(api_key, api_secret)
        
        if market_type == "futures":
            # Verificar se existe no mercado de futuros
            try:
                klines = client.futures_klines(symbol=symbol, interval="1h", limit=limit)
            except:
                return {"data": []}
        else:
            # Verificar mercado spot
            try:
                klines = client.get_klines(symbol=symbol, interval="1h", limit=limit)
            except:
                return {"data": []}
        
        if klines:
            return {
                "data": [{
                    "close": float(klines[0][4]),
                    "volume": float(klines[0][5])
                }]
            }
        else:
            return {"data": []}
            
    except Exception as e:
        return {"data": []}
```

### Resumo de Saldo
```python
@app.get("/api/balance/summary")
async def get_balance_summary():
    try:
        client = Client(api_key, api_secret)
        
        # Saldo Spot
        spot_balance = client.get_account()
        spot_usdt = 0
        for balance in spot_balance['balances']:
            if balance['asset'] == 'USDT':
                spot_usdt = float(balance['free'])
                break
        
        # Saldo Futures
        try:
            futures_balance = client.futures_account_balance()
            futures_usdt = 0
            for balance in futures_balance:
                if balance['asset'] == 'USDT':
                    futures_usdt = float(balance['balance'])
                    break
            futures_available = True
        except:
            futures_usdt = 0
            futures_available = False
        
        return {
            "spot_usdt": spot_usdt,
            "futures_usdt": futures_usdt,
            "spot_available": True,
            "futures_available": futures_available
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 3. Sistema de Grid Trading

### Iniciar Bot
```python
# Armazenar estado dos bots ativos
active_bots = {}

@app.post("/api/grid/start")
async def start_grid_bot(request: dict):
    symbol = request['symbol']
    config = request['config']
    
    try:
        if symbol in active_bots:
            raise HTTPException(status_code=400, detail="Bot já está ativo para este símbolo")
        
        # Inicializar bot
        bot_instance = GridBot(symbol, config)
        await bot_instance.start()
        
        active_bots[symbol] = {
            "bot": bot_instance,
            "status": "running",
            "start_time": datetime.now(),
            "config": config
        }
        
        return {"message": f"Bot iniciado para {symbol}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Status do Bot
```python
@app.get("/api/grid/status/{symbol}")
async def get_bot_status(symbol: str):
    try:
        if symbol not in active_bots:
            return {
                "status": "idle",
                "symbol": symbol,
                "message": "Bot não está ativo"
            }
        
        bot_data = active_bots[symbol]
        bot = bot_data["bot"]
        
        return {
            "status": bot_data["status"],
            "symbol": symbol,
            "market_type": bot_data["config"]["market_type"],
            "current_price": await bot.get_current_price(),
            "grid_levels": bot_data["config"]["initial_levels"],
            "active_orders": len(bot.active_orders),
            "total_trades": bot.total_trades,
            "realized_pnl": bot.realized_pnl,
            "unrealized_pnl": bot.unrealized_pnl,
            "message": "Bot em funcionamento"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 4. Indicadores Técnicos

### Lista de Indicadores
```python
import ta

@app.get("/api/indicators/list")
async def get_indicators_list():
    return [
        "SMA", "EMA", "RSI", "MACD", "ATR", 
        "ADX", "BollingerBands", "Stochastic", "VWAP", "OBV"
    ]
```

### Dados de Indicador
```python
import pandas as pd

@app.get("/api/indicators/{symbol}")
async def get_indicator_data(symbol: str, type: str, period: int = 14):
    try:
        client = Client(api_key, api_secret)
        
        # Obter dados históricos
        klines = client.get_klines(symbol=symbol, interval="1h", limit=200)
        
        # Converter para DataFrame
        df = pd.DataFrame(klines, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 
            'volume', 'close_time', 'quote_asset_volume',
            'number_of_trades', 'taker_buy_base_asset_volume',
            'taker_buy_quote_asset_volume', 'ignore'
        ])
        
        df['close'] = df['close'].astype(float)
        df['high'] = df['high'].astype(float)
        df['low'] = df['low'].astype(float)
        df['volume'] = df['volume'].astype(float)
        
        # Calcular indicador
        values = []
        
        if type == "SMA":
            indicator_values = ta.trend.sma_indicator(df['close'], window=period)
        elif type == "EMA":
            indicator_values = ta.trend.ema_indicator(df['close'], window=period)
        elif type == "RSI":
            indicator_values = ta.momentum.rsi(df['close'], window=period)
        elif type == "MACD":
            indicator_values = ta.trend.macd(df['close'])
        elif type == "ATR":
            indicator_values = ta.volatility.average_true_range(df['high'], df['low'], df['close'], window=period)
        elif type == "ADX":
            indicator_values = ta.trend.adx(df['high'], df['low'], df['close'], window=period)
        else:
            raise HTTPException(status_code=400, detail="Indicador não suportado")
        
        # Formatar resposta
        for i, value in enumerate(indicator_values):
            if pd.notna(value):
                values.append({
                    "timestamp": int(klines[i][0]),
                    "value": float(value)
                })
        
        return {
            "indicator": type,
            "period": period,
            "values": values[-50:]  # Últimos 50 valores
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 5. Pares Recomendados

```python
@app.get("/api/recommended_pairs")
async def get_recommended_pairs():
    try:
        # Implementar lógica de recomendação baseada em:
        # - Volume
        # - Volatilidade
        # - Tendência
        # - Análise técnica
        
        client = Client(api_key, api_secret)
        ticker = client.get_ticker()
        
        recommendations = []
        
        for t in ticker:
            if t['symbol'].endswith('USDT'):
                volume = float(t['volume'])
                change = float(t['priceChangePercent'])
                
                # Calcular score baseado em critérios
                score = 0
                
                # Volume alto = melhor para grid trading
                if volume > 10000000:
                    score += 0.3
                elif volume > 5000000:
                    score += 0.2
                elif volume > 1000000:
                    score += 0.1
                
                # Volatilidade moderada é ideal
                abs_change = abs(change)
                if 1 <= abs_change <= 5:
                    score += 0.4
                elif 0.5 <= abs_change <= 8:
                    score += 0.3
                
                # Adicionar análise técnica aqui...
                # RSI, tendência, suporte/resistência
                
                if score > 0.5:
                    recommendations.append({
                        "symbol": t['symbol'],
                        "score": round(score, 2)
                    })
        
        # Retornar top 10
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:10]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 6. WebSocket para Notificações (Opcional)

```python
from fastapi import WebSocket, WebSocketDisconnect
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass

manager = ConnectionManager()

@app.websocket("/api/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Processar mensagens do cliente se necessário
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Função para enviar notificações
async def send_notification(type: str, message: str):
    await manager.broadcast({
        "type": type,
        "message": message,
        "timestamp": datetime.now().isoformat()
    })
```

---

## 7. Tratamento de Erros

```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor",
            "error": str(exc)
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
```

---

## 8. Configuração de Produção

```python
# config.py
from pydantic import BaseSettings
from typing import List

class Settings(BaseSettings):
    binance_api_key: str
    binance_secret_key: str
    environment: str = "development"
    log_level: str = "INFO"
    cors_origins: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 9. Logging

```python
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/gridbot.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Usar em endpoints
@app.get("/api/status")
async def get_status():
    logger.info("Status endpoint called")
    return {"status": "ok"}
```

---

## 10. Testes

```python
# test_main.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_status_endpoint():
    response = client.get("/api/status")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_trading_pairs():
    response = client.get("/api/trading/pairs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

Estes exemplos fornecem uma base sólida para implementar todos os endpoints necessários no backend. Adapte conforme suas necessidades específicas e adicione validações de segurança apropriadas.
