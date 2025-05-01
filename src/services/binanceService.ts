
import { MarketData, ActiveOrder, Position, TradeHistoryItem } from '../types/trading';

// Mock data for development - in a real app, this would connect to Binance API
const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT', 'SOLUSDT'];

// Generate mock market data
const generateMarketData = (): MarketData[] => {
  return symbols.map(symbol => {
    const lastPrice = Math.random() * (symbol === 'BTCUSDT' ? 60000 : 5000) + 1000;
    const spread = lastPrice * 0.0005; // 0.05% spread
    
    return {
      symbol,
      lastPrice: parseFloat(lastPrice.toFixed(2)),
      bid: parseFloat((lastPrice - spread/2).toFixed(2)),
      ask: parseFloat((lastPrice + spread/2).toFixed(2)),
      volume24h: Math.random() * 1000000000,
      priceChangePercent: (Math.random() * 10) - 5,
      high24h: parseFloat((lastPrice * (1 + Math.random() * 0.05)).toFixed(2)),
      low24h: parseFloat((lastPrice * (1 - Math.random() * 0.05)).toFixed(2))
    };
  });
};

// Mock active orders
const generateActiveOrders = (): ActiveOrder[] => {
  const orders: ActiveOrder[] = [];
  for (let i = 0; i < 5; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const price = Math.random() * 50000 + 1000;
    
    orders.push({
      id: `ord-${Date.now()}-${i}`,
      symbol,
      side,
      type: 'LIMIT',
      price: parseFloat(price.toFixed(2)),
      quantity: parseFloat((Math.random() * 2).toFixed(4)),
      status: 'NEW',
      timestamp: Date.now() - Math.floor(Math.random() * 3600000)
    });
  }
  return orders;
};

// Mock positions
const generatePositions = (): Position[] => {
  const positions: Position[] = [];
  const posSymbols = ['BTCUSDT', 'ETHUSDT'];
  
  for (const symbol of posSymbols) {
    const entryPrice = symbol === 'BTCUSDT' ? 54320.50 : 3210.75;
    const markPrice = symbol === 'BTCUSDT' ? 54410.25 : 3198.50;
    const side = symbol === 'BTCUSDT' ? 'LONG' : 'SHORT';
    
    positions.push({
      symbol,
      side,
      entryPrice,
      markPrice,
      quantity: parseFloat((symbol === 'BTCUSDT' ? 0.15 : 2.5).toFixed(4)),
      leverage: 5,
      unrealizedPnl: symbol === 'BTCUSDT' ? 13.46 : -30.62,
      marginType: 'ISOLATED'
    });
  }
  return positions;
};

// Mock trade history
const generateTradeHistory = (): TradeHistoryItem[] => {
  const trades: TradeHistoryItem[] = [];
  for (let i = 0; i < 15; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const price = Math.random() * 50000 + 1000;
    const quantity = Math.random() * 2;
    const pnl = i % 3 === 0 ? null : (Math.random() * 200) - 100;
    
    trades.push({
      id: `trade-${Date.now()}-${i}`,
      symbol,
      side,
      price: parseFloat(price.toFixed(2)),
      quantity: parseFloat(quantity.toFixed(4)),
      timestamp: Date.now() - Math.floor(Math.random() * 86400000 * 7), // Within last week
      pnl,
      fee: parseFloat((price * quantity * 0.0004).toFixed(4))
    });
  }
  
  return trades.sort((a, b) => b.timestamp - a.timestamp);
};

// Binance API service mock
export const BinanceService = {
  // Get market data
  getMarketData: async (): Promise<MarketData[]> => {
    // Simulate API delay
    return new Promise(resolve => {
      setTimeout(() => resolve(generateMarketData()), 300);
    });
  },
  
  // Get active orders
  getActiveOrders: async (): Promise<ActiveOrder[]> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(generateActiveOrders()), 200);
    });
  },
  
  // Get positions
  getPositions: async (): Promise<Position[]> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(generatePositions()), 250);
    });
  },
  
  // Get trade history
  getTradeHistory: async (): Promise<TradeHistoryItem[]> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(generateTradeHistory()), 350);
    });
  },
  
  // Create a new order
  createOrder: async (symbol: string, side: 'BUY' | 'SELL', type: string, quantity: number, price?: number): Promise<ActiveOrder> => {
    // Simulate order creation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: `ord-${Date.now()}`,
          symbol,
          side,
          type: type as 'LIMIT' | 'MARKET' | 'STOP' | 'TAKE_PROFIT',
          price: price || 0,
          quantity,
          status: 'NEW',
          timestamp: Date.now()
        });
      }, 400);
    });
  },
  
  // Cancel order
  cancelOrder: async (orderId: string): Promise<boolean> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 300);
    });
  }
};
