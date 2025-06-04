
import React, { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from 'lucide-react';
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
  sma7?: number;
  sma25?: number;
  sma99?: number;
  candleType: 'bullish' | 'bearish';
}

interface ProfessionalChartProps {
  symbol: string;
  gridLevels: GridLevel[];
  marketData?: MarketData;
  onSymbolChange: (symbol: string) => void;
}

const ProfessionalChart: React.FC<ProfessionalChartProps> = ({
  symbol,
  gridLevels,
  marketData,
  onSymbolChange
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real data from backend
  const fetchCandleData = useCallback(async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseURL}/klines/${symbol}`, {
        params: {
          interval: timeframe,
          limit: 500,
          market_type: 'spot'
        },
        timeout: 10000
      });

      if (response.data?.data && Array.isArray(response.data.data)) {
        const processedData = processCandles(response.data.data);
        setCandleData(processedData);
      }
    } catch (error) {
      console.error('Error fetching candle data:', error);
    }
    setIsLoading(false);
  }, [symbol, timeframe]);

  // Process candles for continuous display
  const processCandles = (rawCandles: any[]): CandleData[] => {
    return rawCandles.map((k, index) => {
      const open = parseFloat(k.open);
      const high = parseFloat(k.high);
      const low = parseFloat(k.low);
      const close = parseFloat(k.close);
      const volume = parseFloat(k.volume);
      
      // Calculate simple moving averages
      const closes = rawCandles.slice(Math.max(0, index - 99), index + 1).map(c => parseFloat(c.close));
      
      return {
        timestamp: k.timestamp,
        open,
        high,
        low,
        close,
        volume,
        time: new Date(k.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(k.timestamp).toLocaleDateString('pt-BR'),
        sma7: calculateSMA(closes, 7),
        sma25: calculateSMA(closes, 25),
        sma99: calculateSMA(closes, 99),
        candleType: close >= open ? 'bullish' : 'bearish'
      };
    });
  };

  const calculateSMA = (prices: number[], period: number): number | undefined => {
    if (prices.length < period) return undefined;
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  };

  // Custom candlestick component - continuous
  const ContinuousCandlestick = ({ payload, x, y, width, height }: any) => {
    if (!payload) return null;
    
    const { open, high, low, close, candleType } = payload;
    const color = candleType === 'bullish' ? '#26a69a' : '#ef5350';
    
    // Calculate positions for proper candlestick display
    const priceRange = Math.max(...candleData.map(d => d.high)) - Math.min(...candleData.map(d => d.low));
    const minPrice = Math.min(...candleData.map(d => d.low));
    const scale = height / priceRange;
    
    const wickX = x + width / 2;
    const highY = y + (Math.max(...candleData.map(d => d.high)) - high) * scale;
    const lowY = y + (Math.max(...candleData.map(d => d.high)) - low) * scale;
    const openY = y + (Math.max(...candleData.map(d => d.high)) - open) * scale;
    const closeY = y + (Math.max(...candleData.map(d => d.high)) - close) * scale;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(2, Math.abs(closeY - openY));
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + 1}
          y={bodyTop}
          width={Math.max(1, width - 2)}
          height={bodyHeight}
          fill={candleType === 'bullish' ? 'transparent' : color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // Custom volume bar component
  const VolumeBar = ({ payload, x, y, width, height }: any) => {
    if (!payload) return null;
    const color = payload.candleType === 'bullish' ? '#26a69a' : '#ef5350';
    
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={0.7}
      />
    );
  };

  useEffect(() => {
    fetchCandleData();
  }, [fetchCandleData]);

  const currentCandle = candleData[candleData.length - 1];
  const previousCandle = candleData[candleData.length - 2];
  const priceChange = currentCandle && previousCandle ? 
    ((currentCandle.close - previousCandle.close) / previousCandle.close) * 100 : 0;

  return (
    <div className="h-full bg-card rounded-lg border">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold">{symbol}</span>
            {currentCandle && (
              <>
                <span className="text-2xl font-bold">{currentCandle.close.toFixed(2)}</span>
                <span className={`text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
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
            
            <Button variant="outline" size="sm" onClick={fetchCandleData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Chart Stats */}
        {currentCandle && (
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>A: {currentCandle.open.toFixed(2)}</span>
            <span>M: {currentCandle.high.toFixed(2)}</span>
            <span>B: {currentCandle.low.toFixed(2)}</span>
            <span>F: {currentCandle.close.toFixed(2)}</span>
            <span>Vol: {(currentCandle.volume / 1000).toFixed(1)}K</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : candleData.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhum dado disponível</p>
              <p className="text-xs text-muted-foreground">🔴 APENAS DADOS REAIS</p>
            </div>
          </div>
        ) : (
          <div className="h-96">
            {/* Main Chart */}
            <ResponsiveContainer width="100%" height="80%">
              <ComposedChart data={candleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  orientation="right"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3">
                          <p className="font-medium">{data.time} - {data.date}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>A: ${data.open?.toFixed(2)}</div>
                            <div>M: ${data.high?.toFixed(2)}</div>
                            <div>B: ${data.low?.toFixed(2)}</div>
                            <div>F: ${data.close?.toFixed(2)}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Vol: {(data.volume / 1000).toFixed(1)}K
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Candlesticks */}
                <Bar dataKey="close" shape={<ContinuousCandlestick />} />
                
                {/* Moving Averages */}
                <Line type="monotone" dataKey="sma7" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="2 2" />
                <Line type="monotone" dataKey="sma25" stroke="#3b82f6" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="sma99" stroke="#8b5cf6" strokeWidth={1} dot={false} />
                
                {/* Grid levels */}
                {gridLevels.map((level, index) => (
                  <ReferenceLine
                    key={`grid-${index}`}
                    y={level.price}
                    stroke={level.side === 'BUY' ? '#26a69a' : '#ef5350'}
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    opacity={0.6}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
            
            {/* Volume Chart */}
            <ResponsiveContainer width="100%" height="20%">
              <ComposedChart data={candleData} margin={{ top: 0, right: 30, left: 20, bottom: 20 }}>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={false} />
                <YAxis axisLine={false} tickLine={false} tick={false} />
                <Bar 
                  dataKey="volume" 
                  shape={<VolumeBar />}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalChart;
