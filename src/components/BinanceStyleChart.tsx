
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Brush
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  TrendingUp, TrendingDown, BarChart3, Settings, Maximize2, Minimize2,
  RefreshCw, Activity, Play, Square, ChevronUp, ChevronDown, Plus, Minus
} from 'lucide-react';
import { GridLevel, MarketData } from '../types/trading';
import { Timeframe } from '../types/chart';
import axios from 'axios';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string;
  date: string;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
  bollingerMiddle?: number;
  atr?: number;
  obv?: number;
  candleColor: string;
}

interface BinanceStyleChartProps {
  symbol: string;
  gridLevels: GridLevel[];
  marketData?: MarketData;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onStartTrading?: (symbol: string) => void;
}

type IndicatorConfig = {
  [key: string]: {
    enabled: boolean;
    color: string;
    description: string;
    category: 'trend' | 'momentum' | 'volume' | 'volatility';
    complementary?: string[];
  };
};

const BinanceStyleChart: React.FC<BinanceStyleChartProps> = ({
  symbol,
  gridLevels,
  marketData,
  isExpanded = false,
  onToggleExpand,
  onStartTrading
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [visibleCandles, setVisibleCandles] = useState(100);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  
  const chartRef = useRef<HTMLDivElement>(null);

  const [indicators, setIndicators] = useState<IndicatorConfig>({
    sma20: { enabled: true, color: '#f59e0b', description: 'Média Móvel Simples 20', category: 'trend', complementary: ['sma50', 'ema20'] },
    sma50: { enabled: false, color: '#8b5cf6', description: 'Média Móvel Simples 50', category: 'trend', complementary: ['sma20', 'sma200'] },
    sma200: { enabled: false, color: '#ef4444', description: 'Média Móvel Simples 200', category: 'trend', complementary: ['sma50'] },
    ema20: { enabled: false, color: '#06b6d4', description: 'Média Móvel Exponencial 20', category: 'trend', complementary: ['sma20'] },
    ema50: { enabled: false, color: '#10b981', description: 'Média Móvel Exponencial 50', category: 'trend', complementary: ['ema20'] },
    bollinger: { enabled: false, color: '#6b7280', description: 'Bandas de Bollinger', category: 'volatility', complementary: ['sma20'] },
    rsi: { enabled: false, color: '#ec4899', description: 'RSI (14)', category: 'momentum', complementary: ['macd'] },
    macd: { enabled: false, color: '#3b82f6', description: 'MACD', category: 'momentum', complementary: ['rsi'] },
    volume: { enabled: true, color: '#64748b', description: 'Volume', category: 'volume', complementary: ['obv'] },
    obv: { enabled: false, color: '#84cc16', description: 'On Balance Volume', category: 'volume', complementary: ['volume'] },
    atr: { enabled: false, color: '#f97316', description: 'Average True Range', category: 'volatility', complementary: ['bollinger'] }
  });

  // Fetch real candle data from backend
  const fetchCandleData = useCallback(async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseURL}/klines/${symbol}`, {
        params: {
          interval: timeframe,
          limit: Math.max(200, visibleCandles * 2),
          market_type: 'spot'
        },
        timeout: 10000
      });

      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const processedData = processCandles(response.data.data);
        setCandleData(processedData);
        setHasError(false);
        console.log(`✅ Real data loaded for ${symbol}: ${response.data.data.length} candles`);
      } else {
        setCandleData([]);
        setHasError(true);
        setErrorMessage(`No real data available for ${symbol}. Check if backend is running and symbol is valid.`);
      }
    } catch (error: any) {
      console.error(`❌ Error fetching real data for ${symbol}:`, error);
      setCandleData([]);
      setHasError(true);
      setErrorMessage(`Error loading real data: ${error.message}`);
    }
    setIsLoading(false);
    setLastUpdate(Date.now());
  }, [symbol, timeframe, visibleCandles]);

  // Process real candles with indicators (no mock data)
  const processCandles = (rawCandles: any[]): CandleData[] => {
    const candles = rawCandles.map(k => ({
      timestamp: k.timestamp,
      open: parseFloat(k.open),
      high: parseFloat(k.high),
      low: parseFloat(k.low),
      close: parseFloat(k.close),
      volume: parseFloat(k.volume),
      time: new Date(k.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(k.timestamp).toLocaleDateString('pt-BR'),
      candleColor: parseFloat(k.close) >= parseFloat(k.open) ? '#22c55e' : '#ef4444'
    }));

    // Calculate indicators from real data
    return candles.map((candle, index) => {
      const closes = candles.slice(Math.max(0, index - 199), index + 1).map(c => c.close);
      const highs = candles.slice(Math.max(0, index - 199), index + 1).map(c => c.high);
      const lows = candles.slice(Math.max(0, index - 199), index + 1).map(c => c.low);
      const volumes = candles.slice(Math.max(0, index - 199), index + 1).map(c => c.volume);
      
      return {
        ...candle,
        sma20: calculateSMA(closes, 20),
        sma50: calculateSMA(closes, 50),
        sma200: calculateSMA(closes, 200),
        ema20: calculateEMA(closes, 20),
        ema50: calculateEMA(closes, 50),
        rsi: calculateRSI(closes, 14),
        macd: calculateMACD(closes).macd,
        macdSignal: calculateMACD(closes).signal,
        bollingerUpper: calculateBollinger(closes, 20).upper,
        bollingerLower: calculateBollinger(closes, 20).lower,
        bollingerMiddle: calculateBollinger(closes, 20).middle,
        atr: calculateATR(highs, lows, closes, 14),
        obv: calculateOBV(closes, volumes, index)
      };
    });
  };

  // Indicator calculation functions
  const calculateSMA = (prices: number[], period: number): number | undefined => {
    if (prices.length < period) return undefined;
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
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
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (prices: number[]) => {
    const ema12 = calculateEMA(prices, 12) || 0;
    const ema26 = calculateEMA(prices, 26) || 0;
    const macd = ema12 - ema26;
    const signal = calculateEMA([macd], 9) || 0;
    return { macd, signal };
  };

  const calculateBollinger = (prices: number[], period: number) => {
    const sma = calculateSMA(prices, period) || 0;
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance) * 2;
    
    return {
      upper: sma + stdDev,
      middle: sma,
      lower: sma - stdDev
    };
  };

  const calculateATR = (highs: number[], lows: number[], closes: number[], period: number): number | undefined => {
    if (highs.length < period) return undefined;
    const trueRanges = highs.slice(-period).map((high, i) => {
      const low = lows[lows.length - period + i];
      const prevClose = i > 0 ? closes[closes.length - period + i - 1] : closes[closes.length - period];
      return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    });
    return trueRanges.reduce((a, b) => a + b, 0) / period;
  };

  const calculateOBV = (closes: number[], volumes: number[], index: number): number => {
    if (index === 0) return volumes[0];
    let obv = 0;
    for (let i = 1; i <= index && i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) obv += volumes[i];
      else if (closes[i] < closes[i - 1]) obv -= volumes[i];
    }
    return obv;
  };

  // Scroll wheel zoom handler
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -10 : 10;
    setVisibleCandles(prev => Math.max(20, Math.min(500, prev + delta)));
  }, []);

  // Improved candlestick component - clearer visualization
  const CustomCandlestick = ({ payload, x, y, width, height }: any) => {
    if (!payload || !payload.open || !payload.high || !payload.low || !payload.close) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#22c55e' : '#ef4444';
    
    // Calculate price range for proper scaling
    const allPrices = candleData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;
    
    // Scale calculations
    const scale = height / priceRange;
    const wickX = x + width / 2;
    
    // Y positions (inverted because SVG coordinates)
    const highY = y + (maxPrice - high) * scale;
    const lowY = y + (maxPrice - low) * scale;
    const openY = y + (maxPrice - open) * scale;
    const closeY = y + (maxPrice - close) * scale;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    const minBodyHeight = 2; // Minimum visible body height
    
    return (
      <g>
        {/* Wick lines */}
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Candle body */}
        <rect
          x={x + width * 0.2}
          y={bodyTop}
          width={width * 0.6}
          height={Math.max(minBodyHeight, bodyHeight)}
          fill={isGreen ? color : color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // Time formatter based on timeframe
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (timeframe) {
      case '1m':
      case '5m':
      case '15m':
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      case '1h':
      case '4h':
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
               date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      case '1d':
      case '1w':
      case '1M':
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      default:
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Execute order
  const executeOrder = async () => {
    if (!orderPrice || !orderQuantity) return;
    
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      await axios.post(`${baseURL}/trading/order`, {
        symbol,
        side: orderType,
        type: 'LIMIT',
        quantity: parseFloat(orderQuantity),
        price: parseFloat(orderPrice)
      });
      
      setShowOrderPanel(false);
      setOrderPrice('');
      setOrderQuantity('');
    } catch (error) {
      console.error('Error executing order:', error);
    }
  };

  useEffect(() => {
    fetchCandleData();
  }, [fetchCandleData]);

  useEffect(() => {
    const interval = setInterval(fetchCandleData, 30000);
    return () => clearInterval(interval);
  }, [fetchCandleData]);

  useEffect(() => {
    const element = chartRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => element.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const currentCandle = candleData[candleData.length - 1];
  const previousCandle = candleData[candleData.length - 2];
  const priceChange = currentCandle && previousCandle ? 
    ((currentCandle.close - previousCandle.close) / previousCandle.close) * 100 : 0;

  const chartHeight = isExpanded ? 800 : 600;
  const visibleData = candleData.slice(-visibleCandles);

  // Calculate Y-axis domain for proper candle visibility
  const yAxisDomain = useMemo(() => {
    if (visibleData.length === 0) return ['dataMin', 'dataMax'];
    
    const prices = visibleData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = (maxPrice - minPrice) * 0.05; // 5% padding
    
    return [minPrice - padding, maxPrice + padding];
  }, [visibleData]);

  return (
    <div className="w-full space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span className="font-semibold text-lg">{symbol}</span>
          </div>
          
          {currentCandle && (
            <div className="flex items-center gap-4">
              <span className="font-mono text-xl font-bold">
                ${currentCandle.close >= 1 ? currentCandle.close.toFixed(2) : currentCandle.close.toFixed(6)}
              </span>
              <Badge variant={priceChange >= 0 ? 'default' : 'destructive'}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
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
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCandles(prev => Math.max(20, prev - 20))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">{visibleCandles}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCandles(prev => Math.min(500, prev + 20))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOrderPanel(!showOrderPanel)}
          >
            Negociar
          </Button>
          
          {onStartTrading && (
            <Button
              onClick={() => onStartTrading(symbol)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar {symbol}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCandleData()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          {onToggleExpand && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExpand}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Indicators controls */}
      <div className="flex flex-wrap gap-2 px-4">
        {Object.entries(indicators).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1">
            <Switch
              id={key}
              checked={config.enabled}
              onCheckedChange={(checked) => 
                setIndicators(prev => ({ ...prev, [key]: { ...prev[key], enabled: checked } }))
              }
              size="sm"
            />
            <Label htmlFor={key} className="text-xs cursor-pointer" style={{ color: config.color }}>
              {key.toUpperCase()}
            </Label>
          </div>
        ))}
      </div>

      {/* Order panel */}
      {showOrderPanel && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={orderType} onValueChange={(value: 'BUY' | 'SELL') => setOrderType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Compra</SelectItem>
                    <SelectItem value="SELL">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preço</Label>
                <Input
                  type="number"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={executeOrder} className="w-full">
                  {orderType === 'BUY' ? 'Comprar' : 'Vender'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main chart */}
      <div ref={chartRef} className="bg-card border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: chartHeight }}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Carregando dados reais...
            </div>
          </div>
        ) : hasError || candleData.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ height: chartHeight }}>
            <div className="text-center space-y-4">
              <div className="text-4xl">📊</div>
              <h3 className="text-lg font-medium">Sem Dados Reais</h3>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <p className="text-xs text-muted-foreground">Apenas dados reais são exibidos - sem simulações</p>
              <Button onClick={fetchCandleData} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart 
                data={visibleData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="timestamp"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatTime}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={yAxisDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  orientation="right"
                  tickFormatter={(value) => {
                    if (value >= 1000) return `$${(value/1000).toFixed(1)}k`;
                    if (value >= 1) return `$${value.toFixed(2)}`;
                    return `$${value.toFixed(6)}`;
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{formatTime(data.timestamp)}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>A: ${data.open?.toFixed(data.open >= 1 ? 2 : 6)}</div>
                            <div>M: ${data.high?.toFixed(data.high >= 1 ? 2 : 6)}</div>
                            <div>B: ${data.low?.toFixed(data.low >= 1 ? 2 : 6)}</div>
                            <div>F: ${data.close?.toFixed(data.close >= 1 ? 2 : 6)}</div>
                          </div>
                          {data.volume && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Vol: {(data.volume / 1000).toFixed(1)}K
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Candlesticks */}
                <Bar dataKey="close" shape={<CustomCandlestick />} />
                
                {/* Active indicators */}
                {indicators.sma20.enabled && (
                  <Line type="monotone" dataKey="sma20" stroke={indicators.sma20.color} strokeWidth={1} dot={false} />
                )}
                {indicators.sma50.enabled && (
                  <Line type="monotone" dataKey="sma50" stroke={indicators.sma50.color} strokeWidth={1} dot={false} />
                )}
                {indicators.sma200.enabled && (
                  <Line type="monotone" dataKey="sma200" stroke={indicators.sma200.color} strokeWidth={1} dot={false} />
                )}
                {indicators.ema20.enabled && (
                  <Line type="monotone" dataKey="ema20" stroke={indicators.ema20.color} strokeWidth={1} dot={false} />
                )}
                {indicators.ema50.enabled && (
                  <Line type="monotone" dataKey="ema50" stroke={indicators.ema50.color} strokeWidth={1} dot={false} />
                )}
                
                {/* Bollinger Bands */}
                {indicators.bollinger.enabled && (
                  <>
                    <Line type="monotone" dataKey="bollingerUpper" stroke={indicators.bollinger.color} strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="bollingerLower" stroke={indicators.bollinger.color} strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="bollingerMiddle" stroke={indicators.bollinger.color} strokeWidth={1} dot={false} />
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
                    opacity={0.7}
                  />
                ))}
                
                {/* Current price line */}
                {marketData && marketData.lastPrice > 0 && (
                  <ReferenceLine
                    y={marketData.lastPrice}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                  />
                )}
                
                <Brush dataKey="time" height={30} />
              </ComposedChart>
            </ResponsiveContainer>
            
            {/* Volume chart */}
            {indicators.volume.enabled && (
              <ResponsiveContainer width="100%" height="10%">
                <ComposedChart data={visibleData} margin={{ top: 0, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={false} />
                  <YAxis axisLine={false} tickLine={false} tick={false} />
                  <Bar dataKey="volume" fill="#6b7280" opacity={0.6} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
        
        {/* Chart stats */}
        <div className="px-4 py-2 border-t bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Última atualização: {new Date(lastUpdate).toLocaleTimeString('pt-BR')}</span>
              <span>Candles: {candleData.length}</span>
              <span>🔴 APENAS DADOS REAIS</span>
              {currentCandle?.rsi && (
                <span>RSI: {currentCandle.rsi.toFixed(1)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span>Tempo real</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinanceStyleChart;
