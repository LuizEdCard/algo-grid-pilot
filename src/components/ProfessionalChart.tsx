
import React, { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';
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

  // Custom candlestick component - TradingView style
  const TradingViewCandlestick = ({ payload, x, y, width, height }: any) => {
    if (!payload) return null;
    
    const { open, high, low, close, candleType } = payload;
    const isBullish = candleType === 'bullish';
    const color = isBullish ? '#26a69a' : '#ef5350';
    
    // Scale calculations for proper positioning
    const allData = candleData;
    const maxPrice = Math.max(...allData.map(d => d.high));
    const minPrice = Math.min(...allData.map(d => d.low));
    const priceRange = maxPrice - minPrice;
    const scale = height / priceRange;
    
    // Calculate positions
    const wickX = x + width / 2;
    const highY = y + ((maxPrice - high) / priceRange) * height;
    const lowY = y + ((maxPrice - low) / priceRange) * height;
    const openY = y + ((maxPrice - open) / priceRange) * height;
    const closeY = y + ((maxPrice - close) / priceRange) * height;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(closeY - openY));
    
    return (
      <g>
        {/* Upper wick */}
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={Math.min(openY, closeY)}
          stroke={color}
          strokeWidth={1}
        />
        {/* Lower wick */}
        <line
          x1={wickX}
          y1={Math.max(openY, closeY)}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + 2}
          y={bodyTop}
          width={Math.max(1, width - 4)}
          height={bodyHeight}
          fill={isBullish ? 'transparent' : color}
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
    <div className="h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* TradingView Style Header */}
      <div className="border-b border-gray-700 p-3 bg-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <span className="text-white font-medium text-lg">{symbol}</span>
              <span className="text-gray-400 text-sm">· Binance</span>
            </div>
            
            {currentCandle && (
              <div className="flex items-center space-x-4">
                <div className="text-white">
                  <span className="text-sm text-gray-400">O </span>
                  <span className="text-green-400">{currentCandle.open.toFixed(2)}</span>
                </div>
                <div className="text-white">
                  <span className="text-sm text-gray-400">H </span>
                  <span className="text-green-400">{currentCandle.high.toFixed(2)}</span>
                </div>
                <div className="text-white">
                  <span className="text-sm text-gray-400">L </span>
                  <span className="text-red-400">{currentCandle.low.toFixed(2)}</span>
                </div>
                <div className="text-white">
                  <span className="text-sm text-gray-400">C </span>
                  <span className={currentCandle.close >= currentCandle.open ? "text-green-400" : "text-red-400"}>
                    {currentCandle.close.toFixed(2)}
                  </span>
                </div>
                <div className="text-white">
                  <span className="text-sm text-gray-400">Vol·BTC </span>
                  <span className="text-gray-300">{(currentCandle.volume / 1000).toFixed(1)}K</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-700 rounded p-1">
              {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as Timeframe)}
                  className={`px-2 py-1 text-xs rounded ${
                    timeframe === tf 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchCandleData} 
              disabled={isLoading}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Price Display */}
        {currentCandle && (
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-white">
              ${currentCandle.close.toFixed(2)}
            </div>
            <div className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-0 bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : candleData.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-gray-400">Nenhum dado disponível</p>
              <p className="text-xs text-gray-500">Conectando ao backend...</p>
            </div>
          </div>
        ) : (
          <div className="h-96">
            {/* Main Chart - 80% height */}
            <ResponsiveContainer width="100%" height="80%">
              <ComposedChart 
                data={candleData} 
                margin={{ top: 10, right: 60, left: 0, bottom: 0 }}
                style={{ backgroundColor: '#111827' }}
              >
                <CartesianGrid 
                  strokeDasharray="1 1" 
                  stroke="#374151" 
                  opacity={0.3}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  orientation="right"
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 text-sm">
                          <p className="font-medium text-white">{data.time} - {data.date}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="text-gray-300">O: ${data.open?.toFixed(2)}</div>
                            <div className="text-green-400">H: ${data.high?.toFixed(2)}</div>
                            <div className="text-red-400">L: ${data.low?.toFixed(2)}</div>
                            <div className="text-white">C: ${data.close?.toFixed(2)}</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Vol: {(data.volume / 1000).toFixed(1)}K
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Candlesticks */}
                <Bar dataKey="close" shape={<TradingViewCandlestick />} />
                
                {/* Moving Averages - TradingView colors */}
                <Line 
                  type="monotone" 
                  dataKey="sma7" 
                  stroke="#f59e0b" 
                  strokeWidth={1} 
                  dot={false} 
                  strokeDasharray="2 2" 
                />
                <Line 
                  type="monotone" 
                  dataKey="sma25" 
                  stroke="#3b82f6" 
                  strokeWidth={1} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="sma99" 
                  stroke="#8b5cf6" 
                  strokeWidth={1} 
                  dot={false} 
                />
                
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

                {/* Current price line */}
                {marketData && (
                  <ReferenceLine
                    y={marketData.lastPrice}
                    stroke="#f59e0b"
                    strokeDasharray="0"
                    strokeWidth={1}
                    opacity={0.8}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
            
            {/* Volume Chart - 20% height */}
            <ResponsiveContainer width="100%" height="20%">
              <ComposedChart 
                data={candleData} 
                margin={{ top: 0, right: 60, left: 0, bottom: 10 }}
                style={{ backgroundColor: '#111827' }}
              >
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#9CA3AF' }}
                  interval="preserveStartEnd"
                />
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
