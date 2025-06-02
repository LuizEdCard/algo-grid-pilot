
import { MarketData, RLState } from '../types/trading';
import { RealBinanceService } from './realBinanceService';

interface CandlePattern {
  name: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-1
}

interface TechnicalSignal {
  indicator: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-1
  value: number;
}

interface TradingOpportunity {
  symbol: string;
  score: number;
  patterns: CandlePattern[];
  signals: TechnicalSignal[];
  recommendation: 'start_grid' | 'wait' | 'avoid';
  gridConfig?: {
    lowerPrice: number;
    upperPrice: number;
    levels: number;
    spacing: number;
  };
}

// Enhanced RL service with autonomous trading capabilities
export class RLService {
  private state: RLState = {
    currentModel: 'PPO_v2_Enhanced',
    isTraining: false,
    lastTrainingTime: Date.now() - 86400000,
    performance: 0.82,
    confidence: 0.78
  };
  
  private isAutonomousMode = false;
  private lastAnalysis = 0;
  private analysisInterval = 5 * 60 * 1000; // 5 minutes
  private activeBots = new Set<string>();
  private tradingFee = 0.001; // 0.1% fee
  
  // Get current RL state
  getState(): RLState {
    return { ...this.state };
  }
  
  // Predict optimal grid parameters based on market conditions
  async predictGridParameters(
    symbol: string,
    marketData: MarketData[],
    currentPrice: number
  ): Promise<{lowerPrice: number, upperPrice: number, levels: number}> {
    // In a real implementation, this would use the trained RL model
    // For this mockup, we'll use a simple heuristic
    
    const symbolData = marketData.find(data => data.symbol === symbol);
    if (!symbolData) {
      throw new Error(`Market data not found for symbol: ${symbol}`);
    }
    
    // Calculate grid range based on 24h high/low with a buffer
    const range = symbolData.high24h - symbolData.low24h;
    const volatilityFactor = Math.abs(symbolData.priceChangePercent) / 10; // Normalize to 0-1 range
    
    // More volatile markets get wider grids
    const gridWidth = range * (1 + volatilityFactor);
    const lowerPrice = Math.max(currentPrice - gridWidth/2, currentPrice * 0.9);
    const upperPrice = Math.min(currentPrice + gridWidth/2, currentPrice * 1.1);
    
    // Number of levels based on volatility
    const levels = Math.max(5, Math.round(10 * (0.5 + volatilityFactor)));
    
    // Simulate RL thinking time
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          lowerPrice: parseFloat(lowerPrice.toFixed(2)),
          upperPrice: parseFloat(upperPrice.toFixed(2)),
          levels
        });
      }, 500);
    });
  }
  
  // Start training the RL model with new data
  startTraining(): void {
    if (this.state.isTraining) return;
    
    this.state = {
      ...this.state,
      isTraining: true
    };
    
    // Simulate training process
    setTimeout(() => {
      this.state = {
        ...this.state,
        isTraining: false,
        lastTrainingTime: Date.now(),
        performance: Math.min(0.98, this.state.performance + Math.random() * 0.05),
        confidence: Math.min(0.95, this.state.confidence + Math.random() * 0.05)
      };
    }, 10000); // 10 seconds of "training"
  }
  
  // Autonomous mode control
  setAutonomousMode(enabled: boolean): void {
    this.isAutonomousMode = enabled;
    if (enabled) {
      this.startAutonomousAnalysis();
    }
  }

  getAutonomousMode(): boolean {
    return this.isAutonomousMode;
  }

  // Analyze candlestick patterns
  private analyzeCandlePatterns(candles: any[]): CandlePattern[] {
    const patterns: CandlePattern[] = [];
    
    if (candles.length < 3) return patterns;

    for (let i = 2; i < candles.length; i++) {
      const current = candles[i];
      const prev = candles[i - 1];
      const prev2 = candles[i - 2];

      // Doji pattern
      const bodySize = Math.abs(current.close - current.open);
      const priceRange = current.high - current.low;
      if (bodySize / priceRange < 0.1 && priceRange > 0) {
        patterns.push({
          name: 'doji',
          signal: 'neutral',
          strength: 0.6
        });
      }

      // Hammer pattern
      const lowerShadow = Math.min(current.open, current.close) - current.low;
      const upperShadow = current.high - Math.max(current.open, current.close);
      if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
        patterns.push({
          name: 'hammer',
          signal: 'bullish',
          strength: 0.75
        });
      }

      // Engulfing patterns
      if (prev.close < prev.open && current.close > current.open &&
          current.open < prev.close && current.close > prev.open) {
        patterns.push({
          name: 'bullish_engulfing',
          signal: 'bullish',
          strength: 0.85
        });
      }

      if (prev.close > prev.open && current.close < current.open &&
          current.open > prev.close && current.close < prev.open) {
        patterns.push({
          name: 'bearish_engulfing',
          signal: 'bearish',
          strength: 0.85
        });
      }
    }

    return patterns;
  }

  // Analyze technical indicators
  private analyzeTechnicalIndicators(data: any): TechnicalSignal[] {
    const signals: TechnicalSignal[] = [];

    // RSI analysis
    if (data.rsi) {
      if (data.rsi < 30) {
        signals.push({
          indicator: 'RSI',
          signal: 'buy',
          strength: Math.min(1, (30 - data.rsi) / 20),
          value: data.rsi
        });
      } else if (data.rsi > 70) {
        signals.push({
          indicator: 'RSI',
          signal: 'sell',
          strength: Math.min(1, (data.rsi - 70) / 20),
          value: data.rsi
        });
      }
    }

    // MACD analysis
    if (data.macd && data.macdSignal) {
      const macdCrossover = data.macd - data.macdSignal;
      if (macdCrossover > 0) {
        signals.push({
          indicator: 'MACD',
          signal: 'buy',
          strength: Math.min(1, Math.abs(macdCrossover) / 100),
          value: macdCrossover
        });
      } else {
        signals.push({
          indicator: 'MACD',
          signal: 'sell',
          strength: Math.min(1, Math.abs(macdCrossover) / 100),
          value: macdCrossover
        });
      }
    }

    // Moving Average analysis
    if (data.sma20 && data.sma50 && data.close) {
      if (data.close > data.sma20 && data.sma20 > data.sma50) {
        signals.push({
          indicator: 'MA_Trend',
          signal: 'buy',
          strength: 0.7,
          value: (data.close - data.sma20) / data.sma20
        });
      } else if (data.close < data.sma20 && data.sma20 < data.sma50) {
        signals.push({
          indicator: 'MA_Trend',
          signal: 'sell',
          strength: 0.7,
          value: (data.sma20 - data.close) / data.close
        });
      }
    }

    return signals;
  }

  // Analyze trading opportunities
  async analyzeMarketOpportunities(marketData: MarketData[]): Promise<TradingOpportunity[]> {
    const opportunities: TradingOpportunity[] = [];

    for (const market of marketData) {
      try {
        // Get candle data for analysis
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(`${baseURL}/klines/${market.symbol}?limit=50&market_type=spot`);
        const klineData = await response.json();
        
        if (!klineData?.data || klineData.data.length === 0) continue;

        const candles = klineData.data.map((k: any) => ({
          open: parseFloat(k.open),
          high: parseFloat(k.high),
          low: parseFloat(k.low),
          close: parseFloat(k.close),
          volume: parseFloat(k.volume)
        }));

        // Get technical indicators
        const indicators = await this.calculateIndicators(candles);
        
        // Analyze patterns and signals
        const patterns = this.analyzeCandlePatterns(candles);
        const signals = this.analyzeTechnicalIndicators(indicators);

        // Calculate opportunity score
        const score = this.calculateOpportunityScore(patterns, signals, market);

        // Determine recommendation
        const recommendation = this.getRecommendation(score, patterns, signals);

        // Generate grid configuration if recommended
        let gridConfig;
        if (recommendation === 'start_grid') {
          gridConfig = this.generateOptimalGridConfig(market, candles, indicators);
        }

        opportunities.push({
          symbol: market.symbol,
          score,
          patterns,
          signals,
          recommendation,
          gridConfig
        });

      } catch (error) {
        console.error(`Failed to analyze ${market.symbol}:`, error);
      }
    }

    // Sort by score (best opportunities first)
    return opportunities.sort((a, b) => b.score - a.score);
  }

  // Calculate opportunity score
  private calculateOpportunityScore(
    patterns: CandlePattern[],
    signals: TechnicalSignal[],
    market: MarketData
  ): number {
    let score = 0;

    // Pattern scoring
    patterns.forEach(pattern => {
      if (pattern.signal === 'bullish') {
        score += pattern.strength * 0.3;
      } else if (pattern.signal === 'bearish') {
        score -= pattern.strength * 0.2; // Less penalty for bearish (grid can profit both ways)
      }
    });

    // Signal scoring
    signals.forEach(signal => {
      if (signal.signal === 'buy') {
        score += signal.strength * 0.4;
      } else if (signal.signal === 'sell') {
        score += signal.strength * 0.2; // Grid can still profit on sells
      }
    });

    // Volume factor (higher volume = better)
    const volumeScore = Math.min(1, market.volume24h / 10000000) * 0.2;
    score += volumeScore;

    // Volatility factor (moderate volatility is good for grid)
    const volatility = Math.abs(market.priceChangePercent) / 10;
    const volatilityScore = Math.min(1, volatility) * 0.1;
    score += volatilityScore;

    return Math.max(0, Math.min(1, score));
  }

  // Get trading recommendation
  private getRecommendation(
    score: number,
    patterns: CandlePattern[],
    signals: TechnicalSignal[]
  ): 'start_grid' | 'wait' | 'avoid' {
    if (score > 0.75) return 'start_grid';
    if (score > 0.5) return 'wait';
    return 'avoid';
  }

  // Generate optimal grid configuration
  private generateOptimalGridConfig(
    market: MarketData,
    candles: any[],
    indicators: any
  ): { lowerPrice: number; upperPrice: number; levels: number; spacing: number } {
    const currentPrice = market.lastPrice;
    const recentHigh = Math.max(...candles.slice(-20).map(c => c.high));
    const recentLow = Math.min(...candles.slice(-20).map(c => c.low));
    
    // Calculate optimal range based on volatility and support/resistance
    const volatility = Math.abs(market.priceChangePercent) / 100;
    const range = recentHigh - recentLow;
    
    // Adjust range based on confidence and volatility
    const rangeFactor = Math.max(0.1, Math.min(0.3, volatility + 0.1));
    const lowerPrice = currentPrice * (1 - rangeFactor);
    const upperPrice = currentPrice * (1 + rangeFactor);
    
    // Calculate optimal number of levels
    const levels = Math.max(5, Math.min(20, Math.round(range / currentPrice * 1000)));
    
    // Calculate spacing percentage
    const spacing = (upperPrice - lowerPrice) / (levels * currentPrice);
    
    return {
      lowerPrice: Math.round(lowerPrice * 100) / 100,
      upperPrice: Math.round(upperPrice * 100) / 100,
      levels,
      spacing: Math.round(spacing * 10000) / 10000
    };
  }

  // Calculate technical indicators
  private async calculateIndicators(candles: any[]): Promise<any> {
    const closes = candles.map(c => c.close);
    
    // Simple calculations (in real implementation, use ta-lib)
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const rsi = this.calculateRSI(closes, 14);
    const macd = this.calculateMACD(closes);
    
    return {
      close: closes[closes.length - 1],
      sma20,
      sma50,
      rsi,
      ...macd
    };
  }

  // Helper functions for indicator calculations
  private calculateSMA(prices: number[], period: number): number | undefined {
    if (prices.length < period) return undefined;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateRSI(prices: number[], period: number): number | undefined {
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
  }

  private calculateMACD(prices: number[]): { macd: number; macdSignal: number } {
    const ema12 = this.calculateEMA(prices, 12) || 0;
    const ema26 = this.calculateEMA(prices, 26) || 0;
    const macd = ema12 - ema26;
    const macdSignal = this.calculateEMA([macd], 9) || 0;
    
    return { macd, macdSignal };
  }

  private calculateEMA(prices: number[], period: number): number | undefined {
    if (prices.length < period) return undefined;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  }

  // Start autonomous analysis loop
  private async startAutonomousAnalysis(): Promise<void> {
    if (!this.isAutonomousMode) return;

    try {
      // Get market data
      const marketData = await RealBinanceService.getTradingPairs();
      
      // Analyze opportunities
      const opportunities = await this.analyzeMarketOpportunities(marketData);
      
      // Execute on high-confidence opportunities
      for (const opportunity of opportunities.slice(0, 3)) { // Top 3 opportunities
        if (opportunity.recommendation === 'start_grid' && 
            opportunity.score > 0.8 && 
            !this.activeBots.has(opportunity.symbol) &&
            this.activeBots.size < 5) { // Max 5 concurrent bots
          
          await this.executeAutonomousGrid(opportunity);
        }
      }
      
      // Schedule next analysis
      setTimeout(() => this.startAutonomousAnalysis(), this.analysisInterval);
      
    } catch (error) {
      console.error('Autonomous analysis failed:', error);
      // Retry after shorter interval on error
      setTimeout(() => this.startAutonomousAnalysis(), 60000);
    }
  }

  // Execute autonomous grid trading
  private async executeAutonomousGrid(opportunity: TradingOpportunity): Promise<void> {
    try {
      if (!opportunity.gridConfig) return;

      const config = {
        market_type: 'spot' as const,
        initial_levels: opportunity.gridConfig.levels,
        leverage: 1,
        initial_spacing_perc: opportunity.gridConfig.spacing.toString(),
        lower_price: opportunity.gridConfig.lowerPrice,
        upper_price: opportunity.gridConfig.upperPrice,
        autonomous: true,
        min_profit_per_grid: this.tradingFee * 3 // Minimum 3x trading fee profit
      };

      await RealBinanceService.startBot(opportunity.symbol, config);
      this.activeBots.add(opportunity.symbol);
      
      console.log(`Autonomous grid started for ${opportunity.symbol} (score: ${opportunity.score.toFixed(3)})`);
      
      // Monitor and manage the bot
      this.monitorAutonomousBot(opportunity.symbol);
      
    } catch (error) {
      console.error(`Failed to start autonomous grid for ${opportunity.symbol}:`, error);
    }
  }

  // Monitor autonomous bot performance
  private async monitorAutonomousBot(symbol: string): Promise<void> {
    const checkInterval = 30000; // 30 seconds
    let consecutiveLowPerformance = 0;
    
    const monitor = async () => {
      try {
        const status = await RealBinanceService.getBotStatus(symbol);
        
        if (status.status !== 'running') {
          this.activeBots.delete(symbol);
          return;
        }
        
        // Check performance metrics
        const pnl = status.realized_pnl || 0;
        const totalTrades = status.total_trades || 0;
        
        // Stop if performance is consistently poor
        if (totalTrades > 10 && pnl < -50) { // Stop loss at -$50
          consecutiveLowPerformance++;
          if (consecutiveLowPerformance >= 3) {
            await RealBinanceService.stopBot(symbol);
            this.activeBots.delete(symbol);
            console.log(`Autonomous bot stopped for ${symbol} due to poor performance`);
            return;
          }
        } else {
          consecutiveLowPerformance = 0;
        }
        
        // Continue monitoring
        setTimeout(monitor, checkInterval);
        
      } catch (error) {
        console.error(`Failed to monitor bot ${symbol}:`, error);
        setTimeout(monitor, checkInterval * 2);
      }
    };
    
    monitor();
  }

  // Get autonomous trading status
  getAutonomousStatus(): {
    isActive: boolean;
    activeBots: string[];
    lastAnalysis: number;
    nextAnalysis: number;
  } {
    return {
      isActive: this.isAutonomousMode,
      activeBots: Array.from(this.activeBots),
      lastAnalysis: this.lastAnalysis,
      nextAnalysis: this.lastAnalysis + this.analysisInterval
    };
  }

  // Get performance metrics
  getPerformanceMetrics(): {accuracy: number, rewards: number[], episodes: number} {
    return {
      accuracy: this.state.performance,
      rewards: Array(30).fill(0).map((_, i) => Math.sin(i/5) * 10 + this.state.performance * 20 + Math.random() * 5),
      episodes: 512
    };
  }
}

// Singleton instance
export const rlService = new RLService();
