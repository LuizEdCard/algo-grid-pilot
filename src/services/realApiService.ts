
import axios from 'axios';

// Base URL da API Flask
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para log de requisições
api.interceptors.request.use(
  (config) => {
    console.log(`[RealAPI] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[RealAPI] Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    console.log(`[RealAPI] Response from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error('[RealAPI] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Real API Service para Flask Backend
export const RealFlaskApiService = {
  // ===== SYSTEM STATUS =====
  getSystemStatus: async () => {
    const response = await api.get('/api/status');
    return response.data;
  },

  getOperationMode: async () => {
    const response = await api.get('/api/operation_mode');
    return response.data;
  },

  getSystemMetrics: async () => {
    const response = await api.get('/api/metrics');
    return response.data;
  },

  // ===== BALANCE & ACCOUNT =====
  getBalance: async () => {
    const response = await api.get('/api/balance');
    return response.data;
  },

  getBalanceSummary: async () => {
    const response = await api.get('/api/balance/summary');
    return response.data;
  },

  // ===== MARKET DATA =====
  getMarketData: async (limit?: number) => {
    const params = limit ? { limit } : {};
    const response = await api.get('/api/market_data', { params });
    return response.data;
  },

  getKlines: async (symbol: string, interval: string = '1h', limit: number = 100) => {
    const response = await api.get(`/api/klines/${symbol}`, {
      params: { interval, limit }
    });
    return response.data;
  },

  getIndicators: async (symbol: string, indicators?: string, period?: number) => {
    const params: any = {};
    if (indicators) params.indicators = indicators;
    if (period) params.period = period;
    
    const response = await api.get(`/api/indicators/${symbol}`, { params });
    return response.data;
  },

  // ===== TRADING =====
  getTradingPairs: async () => {
    const response = await api.get('/api/trading/pairs');
    return response.data;
  },

  getTradingExecutions: async (limit?: number, symbol?: string) => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (symbol) params.symbol = symbol;
    
    const response = await api.get('/api/trading/executions', { params });
    return response.data;
  },

  getRecommendedPairs: async (limit?: number, marketType?: string) => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (marketType) params.market_type = marketType;
    
    const response = await api.get('/api/recommended_pairs', { params });
    return response.data;
  },

  // Grid Trading
  startGrid: async (symbol: string, marketType: string, initialLevels: number, spacingPerc: number, capitalUsdt: number) => {
    const response = await api.post('/api/grid/start', {
      symbol,
      market_type: marketType,
      initial_levels: initialLevels,
      spacing_perc: spacingPerc,
      capital_usdt: capitalUsdt
    });
    return response.data;
  },

  stopGrid: async (symbol: string) => {
    const response = await api.post('/api/grid/stop', { symbol });
    return response.data;
  },

  getGridStatus: async (symbol: string) => {
    const response = await api.get(`/api/grid/status/${symbol}`);
    return response.data;
  },

  getGridConfig: async () => {
    const response = await api.get('/api/grid/config');
    return response.data;
  },

  updateGridConfig: async (config: any) => {
    const response = await api.post('/api/grid/config', config);
    return response.data;
  },

  // ===== LIVE DATA =====
  getLiveTradingAll: async (limit?: number) => {
    const params = limit ? { limit } : {};
    const response = await api.get('/api/live/trading/all', { params });
    return response.data;
  },

  getLiveTrading: async (symbol: string) => {
    const response = await api.get(`/api/live/trading/${symbol}`);
    return response.data;
  },

  getLiveSystemStatus: async () => {
    const response = await api.get('/api/live/system/status');
    return response.data;
  },

  getLiveProfitsSummary: async (timeframe: string = '24h') => {
    const response = await api.get('/api/live/profits/summary', {
      params: { timeframe }
    });
    return response.data;
  },

  getLiveAlerts: async () => {
    const response = await api.get('/api/live/alerts');
    return response.data;
  },

  // ===== MULTI-AGENT =====
  getAllAgentDecisions: async (limitPerAgent?: number) => {
    const params = limitPerAgent ? { limit_per_agent: limitPerAgent } : {};
    const response = await api.get('/api/live/agents/all/decisions', { params });
    return response.data;
  },

  getAgentDecisions: async (agentName: string, limit?: number, since?: number) => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (since) params.since = since;
    
    const response = await api.get(`/api/live/agents/${agentName}/decisions`, { params });
    return response.data;
  },

  getAgentSystemStatus: async () => {
    const response = await api.get('/api/model/api/system/status');
    return response.data;
  },

  getAgentMetrics: async (agentName: string) => {
    const response = await api.get(`/api/model/api/agents/${agentName}/metrics`);
    return response.data;
  },

  // ===== UTILITY METHODS =====
  
  // Converter market data para o formato esperado pelo frontend
  convertMarketData: (apiData: any) => {
    if (!apiData?.tickers) return [];
    
    return apiData.tickers.map((ticker: any) => ({
      symbol: ticker.symbol,
      lastPrice: parseFloat(ticker.price),
      bid: parseFloat(ticker.price) * 0.9999, // Approximation
      ask: parseFloat(ticker.price) * 1.0001, // Approximation
      volume24h: parseFloat(ticker.volume_24h),
      priceChangePercent: parseFloat(ticker.change_24h.replace('%', '')),
      high24h: parseFloat(ticker.high_24h),
      low24h: parseFloat(ticker.low_24h)
    }));
  },

  // Converter dados de trading para o formato do frontend
  convertTradingData: (apiData: any) => {
    if (!apiData?.active_pairs) return [];
    
    return apiData.active_pairs.map((pair: any) => ({
      symbol: pair.symbol,
      status: pair.status,
      marketType: pair.market_type,
      gridLevels: pair.grid_levels,
      unrealizedPnl: pair.unrealized_pnl,
      openOrders: pair.open_orders
    }));
  }
};

export default RealFlaskApiService;
