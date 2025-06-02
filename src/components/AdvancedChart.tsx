import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart, Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, BarChart3, Crosshair, 
  Layers, Settings, AlertTriangle, Volume2 
} from 'lucide-react';
import { 
  CandlestickData, IndicatorValues, ChartConfig, 
  DrawingTool, CandlestickPattern, Timeframe, OrderBook 
} from '../types/chart';
import { GridLevel, MarketData } from '../types/trading';
import axios from 'axios';

interface AdvancedChartProps {
  symbol: string;
  gridLevels: GridLevel[];
  marketData?: MarketData;
  height?: number;
  onHeightChange?: (height: number) => void;
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({ 
  symbol, 
  gridLevels, 
  marketData, 
  height = 600,
  onHeightChange
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [indicatorData, setIndicatorData] = useState<IndicatorValues[]>([]);
  const [patterns, setPatterns] = useState<CandlestickPattern[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [drawingTools, setDrawingTools] = useState<DrawingTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const [config, setConfig] = useState<ChartConfig>({
    showVolume: true,
    showGrid: true,
    theme: 'dark',
    candleType: 'candle',
    indicators: {
      sma: { enabled: true, periods: [20, 50, 200] },
      ema: { enabled: true, periods: [20, 50] },
      bollinger: { enabled: true, period: 20, stdDev: 2 },
      rsi: { enabled: true, period: 14 },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      atr: { enabled: false, period: 14 },
      obv: { enabled: false }
    }
  });

  // Buscar candles reais do backend
  useEffect(() => {
    let cancelled = false;
    const fetchCandles = async () => {
      if (!symbol) return;
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${baseURL}/klines/${symbol}`, {
          params: {
            interval: timeframe,
            limit: 1000,
            market_type: 'spot'
          }
        });
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0 && !cancelled) {
          setCandleData(data.map((k: any) => ({
            timestamp: k.timestamp,
            open: parseFloat(k.open),
            high: parseFloat(k.high),
            low: parseFloat(k.low),
            close: parseFloat(k.close),
            volume: parseFloat(k.volume)
          })));
        } else if (!cancelled) {
          generateMockData();
        }
      } catch (e) {
        console.log(`Failed to fetch candles for ${symbol}, using mock data:`, e);
        if (!cancelled) generateMockData();
      }
    };
    fetchCandles();
    return () => { cancelled = true; };
  }, [symbol, timeframe, marketData]);

  // Simular dados de candles e indicadores
  useEffect(() => {
    if (!candleData.length) return;
    generateMockIndicators();
    detectCandlestickPatterns();
    
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [candleData]);

  const generateMockData = () => {
    const basePrice = marketData?.lastPrice || 50000;
    const data: CandlestickData[] = [];
    
    for (let i = 1000; i >= 0; i--) {
      const timestamp = Date.now() - (i * getTimeframeMs(timeframe));
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility;
      
      const open = basePrice * (1 + change);
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000;
      
      data.push({ timestamp, open, high, low, close, volume });
    }
    
    setCandleData(data);
  };

  const generateMockIndicators = () => {
    // Simular cálculo de indicadores técnicos
    const indicators: IndicatorValues[] = candleData.map((candle, index) => {
      const prices = candleData.slice(Math.max(0, index - 19), index + 1);
      const closePrices = prices.map(p => p.close);
      
      return {
        timestamp: candle.timestamp,
        sma20: calculateSMA(closePrices, 20),
        sma50: index >= 49 ? calculateSMA(candleData.slice(index - 49, index + 1).map(p => p.close), 50) : undefined,
        sma200: index >= 199 ? calculateSMA(candleData.slice(index - 199, index + 1).map(p => p.close), 200) : undefined,
        ema20: calculateEMA(closePrices, 20),
        rsi: calculateRSI(closePrices, 14),
        macd: calculateMACD(closePrices, 12, 26, 9).macd,
        macdSignal: calculateMACD(closePrices, 12, 26, 9).signal,
        macdHistogram: calculateMACD(closePrices, 12, 26, 9).histogram,
        bollingerUpper: calculateBollinger(closePrices, 20, 2).upper,
        bollingerLower: calculateBollinger(closePrices, 20, 2).lower,
        bollingerMiddle: calculateBollinger(closePrices, 20, 2).middle,
        atr: calculateATR(prices, 14),
        obv: calculateOBV(prices)
      };
    });
    
    setIndicatorData(indicators);
  };

  const detectCandlestickPatterns = () => {
    const detectedPatterns: CandlestickPattern[] = [];
    
    candleData.forEach((candle, index) => {
      if (index < 2) return;
      
      const prev = candleData[index - 1];
      const prev2 = candleData[index - 2];
      
      // Detectar padrão Doji
      if (Math.abs(candle.close - candle.open) / candle.open < 0.001) {
        detectedPatterns.push({
          timestamp: candle.timestamp,
          pattern: 'doji',
          confidence: 0.8
        });
      }
      
      // Detectar Hammer
      const body = Math.abs(candle.close - candle.open);
      const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
      const upperShadow = candle.high - Math.max(candle.open, candle.close);
      
      if (lowerShadow > body * 2 && upperShadow < body * 0.5) {
        detectedPatterns.push({
          timestamp: candle.timestamp,
          pattern: 'hammer',
          confidence: 0.7
        });
      }
      
      // Detectar Engulfing Bullish
      if (prev.close < prev.open && candle.close > candle.open &&
          candle.open < prev.close && candle.close > prev.open) {
        detectedPatterns.push({
          timestamp: candle.timestamp,
          pattern: 'engulfing_bullish',
          confidence: 0.85
        });
      }
    });
    
    setPatterns(detectedPatterns);
  };

  const updateRealTimeData = () => {
    if (!marketData) return;
    
    setCandleData(prev => {
      const lastCandle = prev[prev.length - 1];
      const newPrice = marketData.lastPrice;
      const updatedCandle = {
        ...lastCandle,
        close: newPrice,
        high: Math.max(lastCandle.high, newPrice),
        low: Math.min(lastCandle.low, newPrice),
        volume: lastCandle.volume + Math.random() * 10000
      };
      
      return [...prev.slice(0, -1), updatedCandle];
    });
  };

  // Funções auxiliares para cálculo de indicadores
  const calculateSMA = (prices: number[], period: number): number | undefined => {
    if (prices.length < period) return undefined;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  };

  const calculateEMA = (prices: number[], period: number): number | undefined => {
    if (prices.length < period) return undefined;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  };

  const calculateRSI = (prices: number[], period: number): number | undefined => {
    if (prices.length < period + 1) return undefined;
    let gains = 0, losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (prices: number[], fast: number, slow: number, signal: number) => {
    const emaFast = calculateEMA(prices, fast) || 0;
    const emaSlow = calculateEMA(prices, slow) || 0;
    const macd = emaFast - emaSlow;
    const signalLine = calculateEMA([macd], signal) || 0;
    return {
      macd,
      signal: signalLine,
      histogram: macd - signalLine
    };
  };

  const calculateBollinger = (prices: number[], period: number, stdDev: number) => {
    const sma = calculateSMA(prices, period) || 0;
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDeviation = Math.sqrt(variance) * stdDev;
    
    return {
      upper: sma + stdDeviation,
      middle: sma,
      lower: sma - stdDeviation
    };
  };

  const calculateATR = (candles: CandlestickData[], period: number): number | undefined => {
    if (candles.length < period) return undefined;
    const trueRanges = candles.slice(-period).map((candle, i) => {
      if (i === 0) return candle.high - candle.low;
      const prev = candles[candles.length - period + i - 1];
      return Math.max(
        candle.high - candle.low,
        Math.abs(candle.high - prev.close),
        Math.abs(candle.low - prev.close)
      );
    });
    return trueRanges.reduce((a, b) => a + b, 0) / period;
  };

  const calculateOBV = (candles: CandlestickData[]): number => {
    return candles.reduce((obv, candle, i) => {
      if (i === 0) return candle.volume;
      const prev = candles[i - 1];
      if (candle.close > prev.close) return obv + candle.volume;
      if (candle.close < prev.close) return obv - candle.volume;
      return obv;
    }, 0);
  };

  const getTimeframeMs = (tf: Timeframe): number => {
    const timeframes = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000,
      '1M': 2592000000
    };
    return timeframes[tf];
  };

  // Combinar dados de candles e indicadores
  const chartData = useMemo(() => {
    const allData = candleData.map((candle, index) => ({
      ...candle,
      ...indicatorData[index],
      time: new Date(candle.timestamp).toLocaleTimeString(),
      candleColor: candle.close >= candle.open ? '#22c55e' : '#ef4444',
      wickColor: candle.close >= candle.open ? '#22c55e' : '#ef4444',
      bodyHeight: Math.abs(candle.close - candle.open),
      bodyY: Math.min(candle.open, candle.close),
      wickTop: candle.high,
      wickBottom: candle.low
    }));
    
    // Retornar apenas os dados visíveis baseado no range
    const startIndex = Math.max(0, allData.length - visibleRange.end);
    const endIndex = Math.max(0, allData.length - visibleRange.start);
    return allData.slice(startIndex, endIndex);
  }, [candleData, indicatorData, visibleRange]);


  // Funções de controle do zoom e scroll
  const handleZoomIn = () => {
    setVisibleRange(prev => {
      const currentRange = prev.end - prev.start;
      const newRange = Math.max(20, Math.floor(currentRange * 0.7));
      const center = (prev.start + prev.end) / 2;
      const newStart = Math.max(0, Math.floor(center - newRange / 2));
      const newEnd = Math.min(candleData.length, Math.floor(center + newRange / 2));
      return { start: newStart, end: newEnd };
    });
  };

  const handleZoomOut = () => {
    setVisibleRange(prev => {
      const currentRange = prev.end - prev.start;
      const newRange = Math.min(candleData.length, Math.floor(currentRange * 1.3));
      const center = (prev.start + prev.end) / 2;
      const newStart = Math.max(0, Math.floor(center - newRange / 2));
      const newEnd = Math.min(candleData.length, Math.floor(center + newRange / 2));
      return { start: newStart, end: newEnd };
    });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    setVisibleRange(prev => {
      const range = prev.end - prev.start;
      const step = Math.max(5, Math.floor(range * 0.2));
      
      if (direction === 'left') {
        const newStart = Math.max(0, prev.start - step);
        const newEnd = Math.max(newStart + range, prev.end - step);
        return { start: newStart, end: newEnd };
      } else {
        const newEnd = Math.min(candleData.length, prev.end + step);
        const newStart = Math.min(newEnd - range, prev.start + step);
        return { start: newStart, end: newEnd };
      }
    });
  };

  // Atualizar range visível quando dados mudam
  useEffect(() => {
    if (candleData.length > 0) {
      setVisibleRange({
        start: Math.max(0, candleData.length - 100),
        end: candleData.length
      });
    }
  }, [candleData.length]);

  // Custom candlestick component
  const CandlestickBar = ({ payload, x, y, width, height }: any) => {
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#22c55e' : '#ef4444';
    
    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);
    const bodyHeight = Math.abs(close - open);
    
    // Scale calculations (simplified)
    const scale = height / (high - low);
    const wickX = x + width / 2;
    const bodyY = y + (high - bodyTop) * scale;
    const wickTopY = y;
    const wickBottomY = y + (high - low) * scale;
    const scaledBodyHeight = bodyHeight * scale;
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={wickX}
          y1={wickTopY}
          x2={wickX}
          y2={wickBottomY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={scaledBodyHeight || 2}
          fill={isGreen ? color : color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  const chartConfig = {
    price: { label: "Preço", color: "hsl(var(--chart-1))" },
    volume: { label: "Volume", color: "hsl(var(--chart-2))" },
    sma20: { label: "SMA 20", color: "hsl(var(--chart-3))" },
    sma50: { label: "SMA 50", color: "hsl(var(--chart-4))" },
    ema20: { label: "EMA 20", color: "hsl(var(--chart-5))" },
    rsi: { label: "RSI", color: "hsl(var(--destructive))" },
    macd: { label: "MACD", color: "hsl(var(--primary))" },
    bollinger: { label: "Bollinger", color: "hsl(var(--muted-foreground))" }
  };

  return (
    <div className="space-y-4">
      {/* Controles do Gráfico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {symbol} - Análise Técnica Avançada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="timeframe">Timeframe:</Label>
              <Select value={timeframe} onValueChange={(value: Timeframe) => setTimeframe(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                  <SelectItem value="1w">1w</SelectItem>
                  <SelectItem value="1M">1M</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                id="volume" 
                checked={config.showVolume}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showVolume: checked }))}
              />
              <Label htmlFor="volume">Volume</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                id="grid" 
                checked={config.showGrid}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showGrid: checked }))}
              />
              <Label htmlFor="grid">Grid</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Padrões */}
      {patterns.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-wrap gap-2">
              <strong>Padrões detectados:</strong>
              {patterns.slice(-3).map((pattern, index) => (
                <Badge key={index} variant="secondary">
                  {pattern.pattern.replace('_', ' ').toUpperCase()} ({Math.round(pattern.confidence * 100)}%)
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="main">Gráfico Principal</TabsTrigger>
          <TabsTrigger value="indicators">Indicadores</TabsTrigger>
          <TabsTrigger value="volume">Volume/OBV</TabsTrigger>
          <TabsTrigger value="oscillators">Osciladores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="main" className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2">
              <Button
                variant={config.candleType === 'candle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, candleType: 'candle' }))}
              >
                Velas
              </Button>
              <Button
                variant={config.candleType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, candleType: 'line' }))}
              >
                Linha
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              {/* Controles de Zoom e Scroll */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScroll('left')}
                disabled={visibleRange.start <= 0}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScroll('right')}
                disabled={visibleRange.end >= candleData.length}
              >
                →
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={visibleRange.end - visibleRange.start <= 20}
              >
                +
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={visibleRange.end - visibleRange.start >= candleData.length}
              >
                -
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {visibleRange.end - visibleRange.start} velas | {timeframe}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVisibleRange({
                    start: Math.max(0, candleData.length - 100),
                    end: candleData.length
                  });
                }}
              >
                Reset
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newHeight = height === 600 ? 800 : 600;
                if (onHeightChange) {
                  onHeightChange(newHeight);
                }
                setConfig(prev => ({ ...prev, expanded: newHeight > 600 }));
              }}
            >
              {height > 600 ? 'Reduzir' : 'Expandir'} Gráfico
            </Button>
          </div>
          
          <ChartContainer config={chartConfig} className={`${height > 600 ? 'h-[800px]' : 'h-96'}`}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className={config.showGrid ? '' : 'hidden'} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (typeof value !== 'number' || value <= 0) return '';
                  if (value >= 1000) return `$${(value/1000).toFixed(1)}k`;
                  if (value >= 1) return `$${value.toFixed(2)}`;
                  return `$${value.toFixed(6)}`;
                }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              
              {/* Candlesticks ou linha baseado no tipo */}
              {config.candleType === 'line' ? (
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="var(--color-price)" 
                  strokeWidth={2}
                  dot={false}
                />
              ) : (
                // Para candlesticks, usar linha de close temporariamente até implementar componente customizado
                <>
                  <Line 
                    type="monotone" 
                    dataKey="high" 
                    stroke="#666" 
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="1 1"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="low" 
                    stroke="#666" 
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="1 1"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="open" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={false}
                  />
                </>
              )}
              
              {/* Médias Móveis */}
              {config.indicators.sma.enabled && (
                <>
                  <Line type="monotone" dataKey="sma20" stroke="var(--color-sma20)" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="sma50" stroke="var(--color-sma50)" strokeWidth={1} dot={false} />
                </>
              )}
              
              {config.indicators.ema.enabled && (
                <Line type="monotone" dataKey="ema20" stroke="var(--color-ema20)" strokeWidth={1} dot={false} />
              )}
              
              {/* Bandas de Bollinger */}
              {config.indicators.bollinger.enabled && (
                <>
                  <Line type="monotone" dataKey="bollingerUpper" stroke="var(--color-bollinger)" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                  <Line type="monotone" dataKey="bollingerLower" stroke="var(--color-bollinger)" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                </>
              )}
              
              {/* Grid levels */}
              {gridLevels.map((level, index) => (
                <ReferenceLine 
                  key={`grid-${index}`} 
                  y={level.price} 
                  stroke={level.side === 'BUY' ? '#22c55e' : '#ef4444'} 
                  strokeDasharray={level.status === 'ACTIVE' ? '0' : '5 5'} 
                  strokeWidth={1}
                />
              ))}
              
              {/* Preço atual - sempre visível e dentro do domínio */}
              {marketData && marketData.lastPrice > 0 && (
                <ReferenceLine 
                  y={marketData.lastPrice} 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="2 2" 
                  label={{ 
                    value: `${marketData.lastPrice >= 1 ? '$' + marketData.lastPrice.toFixed(2) : '$' + marketData.lastPrice.toFixed(6)}`, 
                    position: 'insideTopRight',
                    style: { 
                      fill: '#f59e0b', 
                      fontWeight: 'bold',
                      fontSize: '12px',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      padding: '2px 4px',
                      borderRadius: '2px'
                    }
                  }}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        </TabsContent>
        
        <TabsContent value="indicators" className="space-y-4">
          <ChartContainer config={chartConfig} className="h-64">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              
              {config.indicators.macd.enabled && (
                <>
                  <Line type="monotone" dataKey="macd" stroke="var(--color-macd)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="macdSignal" stroke="#ff6b6b" strokeWidth={1} dot={false} />
                  <Bar dataKey="macdHistogram" fill="#4ecdc4" />
                </>
              )}
            </ComposedChart>
          </ChartContainer>
        </TabsContent>
        
        <TabsContent value="volume" className="space-y-4">
          <ChartContainer config={chartConfig} className="h-48">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              
              {config.showVolume && (
                <Bar dataKey="volume" fill="var(--color-volume)" />
              )}
              
              {config.indicators.obv.enabled && (
                <Line type="monotone" dataKey="obv" stroke="#9c88ff" strokeWidth={2} dot={false} />
              )}
            </ComposedChart>
          </ChartContainer>
        </TabsContent>
        
        <TabsContent value="oscillators" className="space-y-4">
          <ChartContainer config={chartConfig} className="h-48">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              
              {config.indicators.rsi.enabled && (
                <Area type="monotone" dataKey="rsi" stroke="var(--color-rsi)" fill="var(--color-rsi)" fillOpacity={0.3} />
              )}
              
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
            </AreaChart>
          </ChartContainer>
        </TabsContent>
      </Tabs>

      {/* Estatísticas em tempo real */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">RSI</span>
              <Badge variant={indicatorData[indicatorData.length - 1]?.rsi > 70 ? "destructive" : 
                             indicatorData[indicatorData.length - 1]?.rsi < 30 ? "default" : "secondary"}>
                {indicatorData[indicatorData.length - 1]?.rsi?.toFixed(1) || '--'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ATR</span>
              <span className="text-sm font-medium">
                {indicatorData[indicatorData.length - 1]?.atr?.toFixed(2) || '--'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Volume 24h</span>
              <span className="text-sm font-medium">
                {marketData?.volume24h ? (marketData.volume24h / 1000000).toFixed(1) + 'M' : '--'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Padrões</span>
              <Badge variant="outline">
                {patterns.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedChart;
