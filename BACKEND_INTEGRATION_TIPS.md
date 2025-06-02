
# Dicas de Integração Backend - Grid Trading Bot

Este documento fornece orientações específicas para implementar os endpoints no backend Python usando ta-lib.

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

## 2. Instalação e Configuração da TA-Lib

### Instalação no Linux/Ubuntu:
```bash
# Instalar dependências do sistema
sudo apt-get update
sudo apt-get install build-essential wget

# Baixar e instalar TA-Lib C library
wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz
tar -xzf ta-lib-0.4.0-src.tar.gz
cd ta-lib/
./configure --prefix=/usr
make
sudo make install

# Instalar Python wrapper
pip install TA-Lib
```

### Instalação no Windows:
```bash
# Baixar wheel pré-compilado ou usar conda
pip install TA-Lib

# Alternativa usando conda:
conda install -c conda-forge ta-lib
```

---

## 3. Implementação dos Endpoints Essenciais

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

## 4. Sistema de Grid Trading

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

## 5. Indicadores Técnicos com TA-Lib

### Lista de Indicadores
```python
import talib
import numpy as np

@app.get("/api/indicators/list")
async def get_indicators_list():
    return [
        "SMA", "EMA", "RSI", "MACD", "ATR", 
        "ADX", "BBANDS", "STOCH", "VWAP", "OBV"
    ]
```

### Dados de Indicador com TA-Lib
```python
import pandas as pd
from binance.client import Client

@app.get("/api/indicators/{symbol}")
async def get_indicator_data(symbol: str, type: str, period: int = 14):
    try:
        client = Client(api_key, api_secret)
        
        # Obter dados históricos (mais dados para cálculos precisos)
        klines = client.get_klines(symbol=symbol, interval="1h", limit=500)
        
        # Converter para arrays numpy (requerido pela TA-Lib)
        closes = np.array([float(k[4]) for k in klines])  # close prices
        highs = np.array([float(k[2]) for k in klines])   # high prices
        lows = np.array([float(k[3]) for k in klines])    # low prices
        volumes = np.array([float(k[5]) for k in klines]) # volumes
        opens = np.array([float(k[1]) for k in klines])   # open prices
        
        # Calcular indicador usando TA-Lib
        values = []
        timestamps = [int(k[0]) for k in klines]
        
        if type == "SMA":
            indicator_values = talib.SMA(closes, timeperiod=period)
        elif type == "EMA":
            indicator_values = talib.EMA(closes, timeperiod=period)
        elif type == "RSI":
            indicator_values = talib.RSI(closes, timeperiod=period)
        elif type == "MACD":
            macd, macdsignal, macdhist = talib.MACD(closes, 
                                                   fastperiod=12, 
                                                   slowperiod=26, 
                                                   signalperiod=9)
            # Retornar apenas MACD line
            indicator_values = macd
        elif type == "ATR":
            indicator_values = talib.ATR(highs, lows, closes, timeperiod=period)
        elif type == "ADX":
            indicator_values = talib.ADX(highs, lows, closes, timeperiod=period)
        elif type == "BBANDS":
            upper, middle, lower = talib.BBANDS(closes, 
                                              timeperiod=period, 
                                              nbdevup=2, 
                                              nbdevdn=2, 
                                              matype=0)
            # Retornar banda média
            indicator_values = middle
        elif type == "STOCH":
            slowk, slowd = talib.STOCH(highs, lows, closes,
                                     fastk_period=5,
                                     slowk_period=3,
                                     slowk_matype=0,
                                     slowd_period=3,
                                     slowd_matype=0)
            # Retornar %K
            indicator_values = slowk
        elif type == "VWAP":
            # VWAP não está na TA-Lib, implementação manual
            typical_price = (highs + lows + closes) / 3
            cumulative_vol = np.cumsum(volumes)
            cumulative_pv = np.cumsum(typical_price * volumes)
            indicator_values = cumulative_pv / cumulative_vol
        elif type == "OBV":
            indicator_values = talib.OBV(closes, volumes)
        else:
            raise HTTPException(status_code=400, detail="Indicador não suportado")
        
        # Formatar resposta (remover valores NaN)
        for i, value in enumerate(indicator_values):
            if not np.isnan(value):
                values.append({
                    "timestamp": timestamps[i],
                    "value": float(value)
                })
        
        return {
            "indicator": type,
            "period": period,
            "values": values[-100:]  # Últimos 100 valores
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Indicadores Avançados com TA-Lib
```python
@app.get("/api/indicators/{symbol}/advanced")
async def get_advanced_indicator_data(symbol: str, type: str, period: int = 14):
    """
    Endpoint para indicadores que retornam múltiplas linhas
    """
    try:
        client = Client(api_key, api_secret)
        klines = client.get_klines(symbol=symbol, interval="1h", limit=500)
        
        closes = np.array([float(k[4]) for k in klines])
        highs = np.array([float(k[2]) for k in klines])
        lows = np.array([float(k[3]) for k in klines])
        timestamps = [int(k[0]) for k in klines]
        
        if type == "MACD":
            macd, signal, histogram = talib.MACD(closes)
            
            return {
                "indicator": "MACD",
                "period": period,
                "macd": [{"timestamp": timestamps[i], "value": float(v)} 
                        for i, v in enumerate(macd) if not np.isnan(v)],
                "signal": [{"timestamp": timestamps[i], "value": float(v)} 
                          for i, v in enumerate(signal) if not np.isnan(v)],
                "histogram": [{"timestamp": timestamps[i], "value": float(v)} 
                             for i, v in enumerate(histogram) if not np.isnan(v)]
            }
            
        elif type == "BBANDS":
            upper, middle, lower = talib.BBANDS(closes, timeperiod=period)
            
            return {
                "indicator": "BBANDS",
                "period": period,
                "upper": [{"timestamp": timestamps[i], "value": float(v)} 
                         for i, v in enumerate(upper) if not np.isnan(v)],
                "middle": [{"timestamp": timestamps[i], "value": float(v)} 
                          for i, v in enumerate(middle) if not np.isnan(v)],
                "lower": [{"timestamp": timestamps[i], "value": float(v)} 
                         for i, v in enumerate(lower) if not np.isnan(v)]
            }
            
        elif type == "STOCH":
            slowk, slowd = talib.STOCH(highs, lows, closes)
            
            return {
                "indicator": "STOCH",
                "period": period,
                "k": [{"timestamp": timestamps[i], "value": float(v)} 
                     for i, v in enumerate(slowk) if not np.isnan(v)],
                "d": [{"timestamp": timestamps[i], "value": float(v)} 
                     for i, v in enumerate(slowd) if not np.isnan(v)]
            }
        
        else:
            raise HTTPException(status_code=400, detail="Indicador avançado não suportado")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 6. Pares Recomendados

```python
@app.get("/api/recommended_pairs")
async def get_recommended_pairs():
    try:
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
                
                # Adicionar análise técnica usando TA-Lib
                try:
                    # Obter dados para RSI
                    klines = client.get_klines(symbol=t['symbol'], interval="1h", limit=50)
                    if len(klines) >= 14:
                        closes = np.array([float(k[4]) for k in klines])
                        rsi = talib.RSI(closes, timeperiod=14)
                        current_rsi = rsi[-1]
                        
                        # RSI próximo aos níveis ideais para grid trading
                        if 30 <= current_rsi <= 70:
                            score += 0.2
                        elif 25 <= current_rsi <= 75:
                            score += 0.1
                            
                except:
                    # Se falhar análise técnica, não adiciona nem remove pontos
                    pass
                
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

## 7. Tratamento de Erros Específicos da TA-Lib

```python
import numpy as np
from fastapi import HTTPException

def safe_talib_calculation(func, *args, **kwargs):
    """
    Wrapper para cálculos TA-Lib com tratamento de erros
    """
    try:
        result = func(*args, **kwargs)
        
        # Verificar se o resultado é válido
        if isinstance(result, tuple):
            # Para indicadores que retornam múltiplos arrays
            return tuple(np.nan_to_num(arr, nan=0.0) for arr in result)
        else:
            # Para indicadores que retornam um array
            return np.nan_to_num(result, nan=0.0)
            
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Erro no cálculo do indicador: {str(e)}"
        )

# Exemplo de uso:
@app.get("/api/indicators/{symbol}/safe")
async def get_safe_indicator_data(symbol: str, type: str, period: int = 14):
    try:
        # ... código para obter dados ...
        
        if type == "RSI":
            indicator_values = safe_talib_calculation(
                talib.RSI, closes, timeperiod=period
            )
        elif type == "MACD":
            macd, signal, histogram = safe_talib_calculation(
                talib.MACD, closes, fastperiod=12, slowperiod=26, signalperiod=9
            )
            indicator_values = macd
            
        # ... resto do código ...
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
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
    
    # Configurações específicas para TA-Lib
    indicator_cache_ttl: int = 300  # 5 minutos
    max_indicator_history: int = 1000
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 9. Cache para Indicadores (Recomendado)

```python
from functools import lru_cache
import time

# Cache simples em memória
indicator_cache = {}

@lru_cache(maxsize=100)
def get_cached_klines(symbol: str, interval: str, limit: int):
    """
    Cache para dados de klines para evitar muitas requisições à Binance
    """
    cache_key = f"{symbol}_{interval}_{limit}"
    current_time = time.time()
    
    if cache_key in indicator_cache:
        data, timestamp = indicator_cache[cache_key]
        if current_time - timestamp < 300:  # 5 minutos
            return data
    
    # Buscar dados frescos
    client = Client(api_key, api_secret)
    klines = client.get_klines(symbol=symbol, interval=interval, limit=limit)
    indicator_cache[cache_key] = (klines, current_time)
    
    return klines
```

---

## 10. Requisitos de Sistema

### requirements.txt
```txt
fastapi==0.104.1
uvicorn==0.24.0
python-binance==1.0.19
TA-Lib==0.4.25
numpy==1.24.3
pandas==2.0.3
pydantic==2.4.2
python-multipart==0.0.6
```

### Dockerfile (opcional)
```dockerfile
FROM python:3.11-slim

# Instalar dependências do sistema para TA-Lib
RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Instalar TA-Lib
RUN wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz && \
    tar -xzf ta-lib-0.4.0-src.tar.gz && \
    cd ta-lib/ && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    cd .. && \
    rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 11. Testes Específicos para TA-Lib

```python
# test_indicators.py
import pytest
import numpy as np
from main import get_indicator_data

def test_rsi_calculation():
    # Teste com dados conhecidos
    closes = np.array([44.0, 44.5, 44.9, 43.7, 44.9, 44.5, 44.6, 44.8, 44.2, 44.6, 44.8, 45.1, 45.3, 45.5, 45.4, 45.2, 45.1, 45.2, 45.1])
    rsi = talib.RSI(closes, timeperiod=14)
    
    # RSI deve estar entre 0 e 100
    assert all(0 <= val <= 100 for val in rsi if not np.isnan(val))

def test_indicator_endpoint():
    response = client.get("/api/indicators/BTCUSDT?type=RSI&period=14")
    assert response.status_code == 200
    data = response.json()
    assert "indicator" in data
    assert "values" in data
    assert len(data["values"]) > 0
```

Estas implementações usam especificamente a TA-Lib e incluem tratamento de erros, cache e otimizações para produção. A TA-Lib é mais rápida e precisa que outras bibliotecas para indicadores técnicos.

