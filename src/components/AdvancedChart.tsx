
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart
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

interface AdvancedChartProps {
  symbol: string;
  gridLevels: GridLevel[];
  marketData?: MarketData;
  height?: number;
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({ 
  symbol, 
  gridLevels, 
  marketData, 
  height = 600 
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [indicatorData, setIndicatorData] = useState<IndicatorValues[]>([]);
  const [patterns, setPatterns] = useState<CandlestickPattern[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [drawingTools, setDrawingTools] = useState<DrawingTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  
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

  // Simular dados de candles e indicadores
  useEffect(() => {
    if (!marketData) return;
    
    generateMockData();
    generateMockIndicators();
    detectCandlestickPatterns();
    
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [symbol, timeframe, marketData]);

  const generateMockData = () => {
    const basePrice = marketData?.lastPrice || 50000;
    const data: CandlestickData[] = [];
    
    for (let i = 100; i >= 0; i--) {
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
    return candleData.map((candle, index) => ({
      ...candle,
      ...indicatorData[index],
      time: new Date(candle.timestamp).toLocaleTimeString()
    }));
  }, [candleData, indicatorData]);

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
          <ChartContainer config={chartConfig} className="h-96">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className={config.showGrid ? '' : 'hidden'} />
              <XAxis dataKey="time" />
              <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
              <ChartTooltip content={<ChartTooltipContent />} />
              
              {/* Preço principal - linha */}
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="var(--color-price)" 
                strokeWidth={2}
                dot={false}
              />
              
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
              
              {/* Preço atual */}
              {marketData && (
                <ReferenceLine 
                  y={marketData.lastPrice} 
                  stroke="#f59e0b" 
                  strokeDasharray="3 3" 
                  label={{ value: `$${marketData.lastPrice.toFixed(2)}`, position: 'insideTopRight' }}
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
