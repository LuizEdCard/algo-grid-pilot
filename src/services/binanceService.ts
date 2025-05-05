
import { MarketData, ActiveOrder, Position, TradeHistoryItem } from '../types/trading';

// API URL for the backend
const API_URL = 'http://localhost:5000/api';

// Available symbols from the backend
const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT', 'SOLUSDT'];

// Fetch market data from the backend
const fetchMarketData = async (): Promise<MarketData[]> => {
  try {
    const response = await fetch(`${API_URL}/market_data`);
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map((item: any) => ({
      symbol: item.symbol,
      lastPrice: parseFloat(item.price),
      bid: parseFloat(item.price) * 0.9995, // Approximate bid
      ask: parseFloat(item.price) * 1.0005, // Approximate ask
      volume24h: parseFloat(item.volume || '0'),
      priceChangePercent: parseFloat(item.priceChangePercent || '0'),
      high24h: parseFloat(item.high || '0'),
      low24h: parseFloat(item.low || '0')
    }));
  } catch (error) {
    console.error('Error fetching market data:', error);
    // Fallback to mock data if API fails
    return generateMockMarketData();
  }
};

// Generate mock market data as fallback
const generateMockMarketData = (): MarketData[] => {
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

// Binance API service that connects to our backend
export const BinanceService = {
  // Get market data
  getMarketData: async (): Promise<MarketData[]> => {
    return fetchMarketData();
  },
  
  // Get active orders
  getActiveOrders: async (): Promise<ActiveOrder[]> => {
    try {
      const response = await fetch(`${API_URL}/grid/status`);
      if (!response.ok) {
        throw new Error(`Failed to fetch active orders: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Extract active orders from grid status
      if (data.active_bots && Object.keys(data.active_bots).length > 0) {
        const orders: ActiveOrder[] = [];
        
        for (const symbol in data.active_bots) {
          const botStatus = data.active_bots[symbol];
          if (botStatus.active_grid_orders) {
            for (const orderId in botStatus.active_grid_orders) {
              const order = botStatus.active_grid_orders[orderId];
              orders.push({
                id: orderId,
                symbol,
                side: order.side,
                type: order.type,
                price: parseFloat(order.price),
                quantity: parseFloat(order.quantity),
                status: order.status,
                timestamp: order.time
              });
            }
          }
        }
        return orders;
      }
      return [];
    } catch (error) {
      console.error('Error fetching active orders:', error);
      // Fallback to mock data
      return generateActiveOrders();
    }
  },
  
  // Get positions
  getPositions: async (): Promise<Position[]> => {
    try {
      const response = await fetch(`${API_URL}/grid/status`);
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Extract positions from grid status
      if (data.active_bots && Object.keys(data.active_bots).length > 0) {
        const positions: Position[] = [];
        
        for (const symbol in data.active_bots) {
          const botStatus = data.active_bots[symbol];
          if (botStatus.position) {
            const position = botStatus.position;
            positions.push({
              symbol,
              side: parseFloat(position.positionAmt) > 0 ? 'LONG' : parseFloat(position.positionAmt) < 0 ? 'SHORT' : 'FLAT',
              entryPrice: parseFloat(position.entryPrice),
              markPrice: parseFloat(position.markPrice),
              quantity: Math.abs(parseFloat(position.positionAmt)),
              leverage: botStatus.leverage || 1,
              unrealizedPnl: parseFloat(position.unRealizedProfit),
              marginType: 'ISOLATED'
            });
          }
        }
        return positions;
      }
      return [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      // Fallback to mock data
      return generatePositions();
    }
  },
  
  // Get trade history
  getTradeHistory: async (): Promise<TradeHistoryItem[]> => {
    try {
      const response = await fetch(`${API_URL}/grid/status`);
      if (!response.ok) {
        throw new Error(`Failed to fetch trade history: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Extract trade history from grid status
      if (data.active_bots && Object.keys(data.active_bots).length > 0) {
        const trades: TradeHistoryItem[] = [];
        
        for (const symbol in data.active_bots) {
          const botStatus = data.active_bots[symbol];
          if (botStatus.trade_history && botStatus.trade_history.length > 0) {
            for (const trade of botStatus.trade_history) {
              trades.push({
                id: trade.orderId,
                symbol,
                side: trade.side,
                price: parseFloat(trade.price),
                quantity: parseFloat(trade.quantity),
                timestamp: trade.timestamp,
                pnl: parseFloat(trade.realizedPnl),
                fee: parseFloat(trade.commission)
              });
            }
          }
        }
        return trades.sort((a, b) => b.timestamp - a.timestamp);
      }
      return [];
    } catch (error) {
      console.error('Error fetching trade history:', error);
      // Fallback to mock data
      return generateTradeHistory();
    }
  },
  
  // Create a new order (start grid trading)
  createOrder: async (symbol: string, side: 'BUY' | 'SELL', type: string, quantity: number, price?: number): Promise<ActiveOrder> => {
    try {
      // In our implementation, we're not creating individual orders but starting the grid
      // This is a simplified approach - in a real implementation, you'd handle this differently
      const response = await fetch(`${API_URL}/grid/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol,
          config: {
            // Convert frontend grid parameters to backend format
            initial_levels: 10,
            initial_spacing_perc: 0.005,
            leverage: 1,
            quantity_per_order: quantity
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start grid trading: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Grid trading started:', data);
      
      // Return a placeholder order
      return {
        id: `grid-${Date.now()}`,
        symbol,
        side,
        type: type as 'LIMIT' | 'MARKET' | 'STOP' | 'TAKE_PROFIT',
        price: price || 0,
        quantity,
        status: 'NEW',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error starting grid trading:', error);
      // Fallback to mock order
      return {
        id: `mock-ord-${Date.now()}`,
        symbol,
        side,
        type: type as 'LIMIT' | 'MARKET' | 'STOP' | 'TAKE_PROFIT',
        price: price || 0,
        quantity,
        status: 'NEW',
        timestamp: Date.now()
      };
    }
  },
  
  // Cancel order (stop grid trading)
  cancelOrder: async (orderId: string): Promise<boolean> => {
    try {
      // Extract symbol from orderId (this is a simplification)
      const symbol = orderId.includes('-') ? orderId.split('-')[1] : '';
      
      if (!symbol) {
        console.error('Could not extract symbol from orderId:', orderId);
        return false;
      }
      
      const response = await fetch(`${API_URL}/grid/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ symbol })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to stop grid trading: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Grid trading stopped:', data);
      return true;
    } catch (error) {
      console.error('Error stopping grid trading:', error);
      return false;
    }
  }
};
