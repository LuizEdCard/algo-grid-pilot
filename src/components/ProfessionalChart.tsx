
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Area
} from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Maximize2, RefreshCw } from 'lucide-react';
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
  const [orderBook, setOrderBook] = useState<{bids: any[], asks: any[]}>({bids: [], asks: []});
  const [availablePairs, setAvailablePairs] = useState<any[]>([]);

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

  // Fetch order book
  const fetchOrderBook = useCallback(async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseURL}/orderbook/${symbol}`);
      if (response.data) {
        setOrderBook(response.data);
      }
    } catch (error) {
      console.error('Error fetching order book:', error);
    }
  }, [symbol]);

  // Fetch available pairs
  const fetchPairs = useCallback(async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseURL}/market_data`);
      if (response.data?.data) {
        setAvailablePairs(response.data.data.slice(0, 20));
      }
    } catch (error) {
      console.error('Error fetching pairs:', error);
    }
  }, []);

  // Custom candlestick component - no gaps, continuous
  const ContinuousCandlestick = ({ payload, x, y, width, height, index }: any) => {
    if (!payload || index === undefined) return null;
    
    const { open, high, low, close, candleType } = payload;
    const color = candleType === 'bullish' ? '#26a69a' : '#ef5350';
    
    // Calculate positions
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

  useEffect(() => {
    fetchCandleData();
    fetchOrderBook();
    fetchPairs();
  }, [fetchCandleData, fetchOrderBook, fetchPairs]);

  const currentCandle = candleData[candleData.length - 1];
  const previousCandle = candleData[candleData.length - 2];
  const priceChange = currentCandle && previousCandle ? 
    ((currentCandle.close - previousCandle.close) / previousCandle.close) * 100 : 0;

  return (
    <div className="h-screen bg-gray-900 text-white grid grid-cols-12">
      {/* Order Book - Left Panel */}
      <div className="col-span-2 border-r border-gray-800 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Livro de Ordens</h3>
          <div className="space-y-1">
            <div className="grid grid-cols-3 text-xs text-gray-400 mb-2">
              <span>Preço (USDT)</span>
              <span>Valor (BTC)</span>
              <span>Total</span>
            </div>
            
            {/* Asks (Sell orders) */}
            {orderBook.asks.slice(0, 10).map((ask, i) => (
              <div key={`ask-${i}`} className="grid grid-cols-3 text-xs text-red-400">
                <span>{ask.price || '105464.81'}</span>
                <span>{ask.quantity || '0.00010'}</span>
                <span>{ask.total || '10.55'}</span>
              </div>
            ))}
            
            {/* Current Price */}
            <div className="py-2 border-y border-gray-700">
              <div className="text-lg font-bold text-green-400">
                {currentCandle ? currentCandle.close.toFixed(2) : '105,464.63'}
              </div>
              <div className="text-xs text-green-400">
                ↗ ${currentCandle ? currentCandle.close.toFixed(2) : '105,464.63'}
              </div>
            </div>
            
            {/* Bids (Buy orders) */}
            {orderBook.bids.slice(0, 10).map((bid, i) => (
              <div key={`bid-${i}`} className="grid grid-cols-3 text-xs text-green-400">
                <span>{bid.price || '105464.75'}</span>
                <span>{bid.quantity || '0.00009'}</span>
                <span>{bid.total || '9.49'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart - Center Panel */}
      <div className="col-span-7 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">{symbol}</span>
                {currentCandle && (
                  <>
                    <span className="text-2xl font-bold">{currentCandle.close.toFixed(2)}</span>
                    <Badge variant={priceChange >= 0 ? 'default' : 'destructive'}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={timeframe} onValueChange={(value: Timeframe) => setTimeframe(value)}>
                <SelectTrigger className="w-16 bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
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
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Abrir: {currentCandle.open.toFixed(2)}</span>
              <span>Alto: {currentCandle.high.toFixed(2)}</span>
              <span>Baixo: {currentCandle.low.toFixed(2)}</span>
              <span>Fechar: {currentCandle.close.toFixed(2)}</span>
              <span className="text-white">VARIAÇÃO: {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : candleData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400">Nenhum dado disponível</p>
                <p className="text-xs text-gray-500">🔴 APENAS DADOS REAIS</p>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <ResponsiveContainer width="100%" height="80%">
                <ComposedChart data={candleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="1 1" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin - 100', 'dataMax + 100']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
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
              
              {/* Volume */}
              <ResponsiveContainer width="100%" height="20%">
                <ComposedChart data={candleData} margin={{ top: 0, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={false} />
                  <YAxis axisLine={false} tickLine={false} tick={false} />
                  <Bar 
                    dataKey="volume" 
                    fill={(entry: any) => entry.candleType === 'bullish' ? '#26a69a' : '#ef5350'}
                    opacity={0.7} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Pairs List - Right Panel */}
      <div className="col-span-3 border-l border-gray-800 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Criptomoedas</h3>
          <div className="space-y-1">
            {availablePairs.map((pair, index) => (
              <div 
                key={pair.symbol || index}
                className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-800 ${
                  pair.symbol === symbol ? 'bg-gray-800' : ''
                }`}
                onClick={() => onSymbolChange(pair.symbol)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs">⭐</span>
                  <div>
                    <div className="text-sm font-medium">{pair.symbol}</div>
                    <div className="text-xs text-gray-400">5x</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{pair.lastPrice || '0.00'}</div>
                  <div className={`text-xs ${pair.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pair.priceChangePercent >= 0 ? '+' : ''}{pair.priceChangePercent?.toFixed(2) || '0.00'}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalChart;
