
export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  timestamp: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
  bollingerMiddle?: number;
  atr?: number;
  obv?: number;
}

export interface ChartConfig {
  showVolume: boolean;
  showGrid: boolean;
  theme: 'light' | 'dark';
  candleType: 'candle' | 'bar' | 'line';
  indicators: {
    sma: { enabled: boolean; periods: number[] };
    ema: { enabled: boolean; periods: number[] };
    bollinger: { enabled: boolean; period: number; stdDev: number };
    rsi: { enabled: boolean; period: number };
    macd: { enabled: boolean; fast: number; slow: number; signal: number };
    atr: { enabled: boolean; period: number };
    obv: { enabled: boolean };
  };
}

export interface DrawingTool {
  id: string;
  type: 'trendline' | 'horizontal' | 'fibonacci' | 'rectangle';
  points: { x: number; y: number }[];
  color: string;
  style: 'solid' | 'dashed';
}

export interface CandlestickPattern {
  timestamp: number;
  pattern: 'hammer' | 'doji' | 'engulfing_bullish' | 'engulfing_bearish' | 'shooting_star';
  confidence: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdate: number;
}
