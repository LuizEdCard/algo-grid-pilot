
import api from './apiService';
import { MarketData, ActiveOrder, Position, TradeHistoryItem } from '../types/trading';

export interface BotStatus {
  status: string;
  symbol?: string;
  market_type?: string;
  current_price?: number;
  grid_levels?: number;
  active_orders?: number;
  total_trades?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  message?: string;
}

export interface BalanceSummary {
  spot_usdt: number;
  futures_usdt: number;
  spot_available: boolean;
  futures_available: boolean;
}

export interface RLStatus {
  rl_available: boolean;
  onnx_model_loaded: boolean;
  total_active_bots: number;
}

export interface TrainingStatus {
  training: boolean;
  progress: number;
  current_episode: number;
  total_episodes: number;
}

export interface TradeExecution {
  id: number;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  qty: number;
  timestamp: number;
}

export interface IndicatorData {
  indicator: string;
  period: number;
  values: { timestamp: number; value: number }[];
}

export interface RecommendedPair {
  symbol: string;
  score: number;
}

export const RealBinanceService = {
  // Verificar status do backend
  async checkStatus(): Promise<{ status: string }> {
    const response = await api.get('/status');
    return response.data;
  },

  // Obter pares de trading ativos
  async getTradingPairs(): Promise<MarketData[]> {
    try {
      const response = await api.get('/trading/pairs');
      return response.data.map((item: any) => ({
        symbol: item.symbol,
        lastPrice: parseFloat(item.price),
        bid: parseFloat(item.price) * 0.999,
        ask: parseFloat(item.price) * 1.001,
        volume24h: parseFloat(item.volume),
        priceChangePercent: parseFloat(item.change_24h || '0'),
        high24h: parseFloat(item.high_24h || item.price),
        low24h: parseFloat(item.low_24h || item.price)
      }));
    } catch (error) {
      console.warn('Failed to fetch trading pairs, falling back to market data');
      return this.getMarketData();
    }
  },

  // Fallback para dados de mercado
  async getMarketData(): Promise<MarketData[]> {
    const response = await api.get('/market_data');
    return response.data.map((item: any) => ({
      symbol: item.symbol,
      lastPrice: parseFloat(item.price),
      bid: parseFloat(item.price) * 0.999,
      ask: parseFloat(item.price) * 1.001,
      volume24h: parseFloat(item.volume),
      priceChangePercent: parseFloat(item.change_24h || '0'),
      high24h: parseFloat(item.high_24h || item.price),
      low24h: parseFloat(item.low_24h || item.price)
    }));
  },

  // Validar par customizado
  async validateCustomPair(symbol: string, marketType: 'spot' | 'futures'): Promise<boolean> {
    try {
      const response = await api.get(`/klines/${symbol}?limit=1&market_type=${marketType}`);
      return response.data && response.data.data && response.data.data.length > 0;
    } catch (error) {
      return false;
    }
  },

  // Obter lista de indicadores disponíveis
  async getAvailableIndicators(): Promise<string[]> {
    const response = await api.get('/indicators/list');
    return response.data;
  },

  // Obter dados de indicador específico
  async getIndicatorData(symbol: string, type: string, period: number): Promise<IndicatorData> {
    const response = await api.get(`/indicators/${symbol}?type=${type}&period=${period}`);
    return response.data;
  },

  // Obter pares recomendados
  async getRecommendedPairs(): Promise<RecommendedPair[]> {
    const response = await api.get('/recommended_pairs');
    return response.data;
  },

  // Obter resumo de saldo
  async getBalanceSummary(): Promise<BalanceSummary> {
    const response = await api.get('/balance/summary');
    return response.data;
  },

  // Iniciar bot
  async startBot(symbol: string, config: any): Promise<{ message: string }> {
    const response = await api.post('/grid/start', {
      symbol,
      config
    });
    return response.data;
  },

  // Parar bot
  async stopBot(symbol: string): Promise<{ message: string }> {
    const response = await api.post('/grid/stop', { symbol });
    return response.data;
  },

  // Status do bot
  async getBotStatus(symbol: string): Promise<BotStatus> {
    const response = await api.get(`/grid/status/${symbol}`);
    return response.data;
  },

  // Status do RL
  async getRLStatus(): Promise<RLStatus> {
    const response = await api.get('/rl/status');
    return response.data;
  },

  // Execuções de trades
  async getTradeExecutions(symbol: string): Promise<TradeExecution[]> {
    const response = await api.get(`/trades/${symbol}`);
    return response.data;
  },

  // Status de treinamento RL
  async getTrainingStatus(): Promise<TrainingStatus> {
    const response = await api.get('/rl/training_status');
    return response.data;
  },

  // Create order method for grid service compatibility
  async createOrder(symbol: string, side: 'BUY' | 'SELL', type: string, quantity: number, price: number): Promise<{ id: string }> {
    const response = await api.post('/trading/orders', {
      symbol,
      side,
      type,
      quantity,
      price
    });
    return { id: response.data.orderId || `order_${Date.now()}` };
  },

  // Cancel order method for grid service compatibility
  async cancelOrder(orderId: string): Promise<void> {
    await api.delete(`/trading/orders/${orderId}`);
  },

  // Manter compatibilidade com interface antiga
  async getActiveOrders(): Promise<ActiveOrder[]> {
    // Implementar se necessário com endpoint específico
    return [];
  },

  async getPositions(): Promise<Position[]> {
    // Implementar se necessário com endpoint específico
    return [];
  },

  async getTradeHistory(): Promise<TradeHistoryItem[]> {
    // Implementar se necessário com endpoint específico
    return [];
  }
};
