
export type TradingMode = 'production';

export interface GridConfig {
  symbol: string;
  leverage: number;
  gridLevels: number;
  upperPrice: number;
  lowerPrice: number;
  quantity: number;
  profitMargin: number;
  dynamicSpacing: boolean;
  rebalanceThreshold: number;
}

export interface PairCriteria {
  minVolume: number;
  minVolatility: number;
  maxSpread: number;
  maxADX: number;
}

export interface RiskParams {
  maxDrawdown: number;
  stopLossPercent: number;
  trailingStopEnabled: boolean;
  trailingStopOffset: number;
  profitLockPercentage: number;
}

export interface TradeHistoryItem {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  pnl: number | null;
  fee: number;
}

export interface ActiveOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP' | 'TAKE_PROFIT';
  price: number;
  quantity: number;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  timestamp: number;
}

export interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  markPrice: number;
  quantity: number;
  leverage: number;
  unrealizedPnl: number;
  marginType: 'ISOLATED' | 'CROSS';
}

export interface GridLevel {
  price: number;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderId?: string;
  status: 'PENDING' | 'ACTIVE' | 'FILLED' | 'CANCELED';
}

export interface MarketData {
  symbol: string;
  lastPrice: number;
  bid: number;
  ask: number;
  volume24h: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
}

export interface TradingStats {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  dailyPnL: number[];
  drawdown: number;
  maxDrawdown: number;
}

export interface RLState {
  currentModel: string;
  isTraining: boolean;
  lastTrainingTime: number;
  performance: number; // Normalized 0-1 score of RL agent performance
  confidence: number; // Confidence level in current predictions
}
