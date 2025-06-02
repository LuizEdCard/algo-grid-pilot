import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Activity
} from 'lucide-react';
import { GridLevel, MarketData } from '../types/trading';
import axios from 'axios';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string;
  sma20?: number;
  sma50?: number;
  ema20?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
  candleColor: string;
}

interface TradingViewChartProps {
  symbol: string;
  gridLevels: GridLevel[];
  marketData?: MarketData;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  gridLevels,
  marketData,
  isExpanded = false,
  onToggleExpand
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Indicators state
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: false,
    ema20: false,
    rsi: false,
    macd: false,
    bollinger: false,
    volume: true
  });

  // Fetch candle data - APENAS DADOS REAIS
  const fetchCandleData = async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseURL}/klines/${symbol}`, {
        params: {
          interval: timeframe,
          limit: 200,
          market_type: 'spot'
        },
        timeout: 10000
      });

      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const processedData = await processCandles(response.data.data);
        setCandleData(processedData);
        setHasError(false);
        console.log(`✅ Dados reais carregados para ${symbol}: ${response.data.data.length} candles`);
      } else {
        console.warn(`⚠️ Backend retornou dados vazios para ${symbol}`);
        setCandleData([]);
        setHasError(true);
        setErrorMessage(`Nenhum dado disponível para ${symbol}. Verifique se o par é válido e se o backend está funcionando.`);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao buscar dados para ${symbol}:`, error);
      setCandleData([]);
      setHasError(true);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setErrorMessage('Falha na conexão com o backend. Verifique se o servidor Python está rodando.');
      } else if (error.response?.status === 404) {
        setErrorMessage(`Endpoint não encontrado para ${symbol}. Verifique se o backend possui os dados deste par.`);
      } else if (error.response?.status === 500) {
        setErrorMessage('Erro interno do servidor. Verifique os logs do backend.');
      } else {
        setErrorMessage(`Erro ao carregar dados: ${error.message}`);
      }
    }
    setIsLoading(false);
    setLastUpdate(Date.now());
  };

  // Process candles with indicators
  const processCandles = async (rawCandles: any[]): Promise<CandleData[]> => {
    const candles = rawCandles.map(k => ({
      timestamp: k.timestamp,
      open: parseFloat(k.open),
      high: parseFloat(k.high),
      low: parseFloat(k.low),
      close: parseFloat(k.close),
      volume: parseFloat(k.volume),
      time: new Date(k.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      candleColor: parseFloat(k.close) >= parseFloat(k.open) ? '#22c55e' : '#ef4444'
    }));

    // Calculate indicators
    return candles.map((candle, index) => {
      const closes = candles.slice(Math.max(0, index - 49), index + 1).map(c => c.close);
      
      return {
        ...candle,
        sma20: calculateSMA(closes, 20),
        sma50: calculateSMA(closes, 50),
        ema20: calculateEMA(closes, 20),
        rsi: calculateRSI(closes, 14),
        macd: calculateMACD(closes).macd,
        macdSignal: calculateMACD(closes).signal,
        bollingerUpper: calculateBollinger(closes, 20).upper,
        bollingerLower: calculateBollinger(closes, 20).lower
      };
    });
  };

  // Check backend connection status
  const checkBackendConnection = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      await axios.get(`${baseURL}/status`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Helper functions for indicators
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
      lower: sma - stdDev
    };
  };

  const getTimeframeMs = (tf: Timeframe): number => {
    const timeframes = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000
    };
    return timeframes[tf];
  };

  // Custom candlestick component
  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#22c55e' : '#ef4444';
    
    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);
    const bodyHeight = Math.abs(close - open) || 1;
    
    const priceRange = high - low;
    const scale = height / priceRange;
    
    const wickX = x + width / 2;
    const bodyY = y + (high - bodyTop) * scale;
    const wickTopY = y;
    const wickBottomY = y + height;
    const scaledBodyHeight = Math.max(1, bodyHeight * scale);
    
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
          height={scaledBodyHeight}
          fill={isGreen ? color : color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // Effects
  useEffect(() => {
    fetchCandleData();
  }, [symbol, timeframe]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (candleData.length > 0) {
        fetchCandleData();
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [symbol, timeframe, candleData.length]);

  // Get current stats
  const currentCandle = candleData[candleData.length - 1];
  const previousCandle = candleData[candleData.length - 2];
  const priceChange = currentCandle && previousCandle ? 
    ((currentCandle.close - previousCandle.close) / previousCandle.close) * 100 : 0;

  const chartHeight = isExpanded ? 700 : 500;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {symbol}
            </CardTitle>
            
            {currentCandle && (
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono text-lg font-bold">
                  ${currentCandle.close.toFixed(2)}
                </span>
                <Badge variant={priceChange >= 0 ? 'default' : 'destructive'}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
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
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Label>Timeframe:</Label>
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
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={chartType === 'candle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('candle')}
            >
              Velas
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Linha
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Indicator toggles */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Switch
                id="sma20"
                checked={indicators.sma20}
                onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, sma20: checked }))}
                size="sm"
              />
              <Label htmlFor="sma20" className="text-xs">SMA 20</Label>
            </div>
            
            <div className="flex items-center gap-1">
              <Switch
                id="sma50"
                checked={indicators.sma50}
                onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, sma50: checked }))}
                size="sm"
              />
              <Label htmlFor="sma50" className="text-xs">SMA 50</Label>
            </div>
            
            <div className="flex items-center gap-1">
              <Switch
                id="bollinger"
                checked={indicators.bollinger}
                onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, bollinger: checked }))}
                size="sm"
              />
              <Label htmlFor="bollinger" className="text-xs">Bollinger</Label>
            </div>
            
            <div className="flex items-center gap-1">
              <Switch
                id="volume"
                checked={indicators.volume}
                onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, volume: checked }))}
                size="sm"
              />
              <Label htmlFor="volume" className="text-xs">Volume</Label>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: chartHeight }}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Carregando dados do backend...
            </div>
          </div>
        ) : hasError || candleData.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ height: chartHeight }}>
            <div className="text-center space-y-4 max-w-md">
              <div className="text-4xl">📊</div>
              <h3 className="text-lg font-medium text-foreground">
                {hasError ? 'Erro ao Carregar Dados' : 'Sem Dados Disponíveis'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {errorMessage || `Nenhum dado encontrado para ${symbol}. Verifique se o backend está funcionando e se o par é válido.`}
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>✅ Usando apenas dados reais do backend</p>
                <p>❌ Dados simulados foram removidos para precisão</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCandleData()}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={candleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={['dataMin - 50', 'dataMax + 50']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  orientation="right"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{label}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>O: ${data.open?.toFixed(2)}</div>
                            <div>H: ${data.high?.toFixed(2)}</div>
                            <div>L: ${data.low?.toFixed(2)}</div>
                            <div>C: ${data.close?.toFixed(2)}</div>
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
                
                {/* Candlesticks or Line */}
                {chartType === 'line' ? (
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                ) : (
                  <Bar dataKey="close" shape={<CustomCandlestick />} />
                )}
                
                {/* Moving Averages */}
                {indicators.sma20 && (
                  <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={1} dot={false} />
                )}
                {indicators.sma50 && (
                  <Line type="monotone" dataKey="sma50" stroke="#8b5cf6" strokeWidth={1} dot={false} />
                )}
                {indicators.ema20 && (
                  <Line type="monotone" dataKey="ema20" stroke="#06b6d4" strokeWidth={1} dot={false} />
                )}
                
                {/* Bollinger Bands */}
                {indicators.bollinger && (
                  <>
                    <Line type="monotone" dataKey="bollingerUpper" stroke="#6b7280" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="bollingerLower" stroke="#6b7280" strokeWidth={1} strokeDasharray="3 3" dot={false} />
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
                
                {/* Current price */}
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
            {indicators.volume && (
              <ResponsiveContainer width="100%" height="15%">
                <ComposedChart data={candleData} margin={{ top: 0, right: 30, left: 20, bottom: 20 }}>
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
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;