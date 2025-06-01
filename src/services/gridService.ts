
import { GridConfig, GridLevel, Position, TradingMode, MarketData } from '../types/trading';
import { RealBinanceService } from './realBinanceService';

// Production grid trading logic
export class GridTradingService {
  private gridConfig: GridConfig | null = null;
  private gridLevels: GridLevel[] = [];
  private mode: TradingMode = 'production';
  private isRunning = false;
  private lastRebalance = 0;

  // Initialize grid
  initializeGrid(config: GridConfig): GridLevel[] {
    this.gridConfig = config;
    this.gridLevels = [];

    if (!config) return [];

    const { upperPrice, lowerPrice, gridLevels, quantity } = config;
    const priceInterval = (upperPrice - lowerPrice) / gridLevels;

    // Create grid levels
    for (let i = 0; i <= gridLevels; i++) {
      const price = lowerPrice + (priceInterval * i);
      const side = i < gridLevels / 2 ? 'BUY' : 'SELL';
      
      this.gridLevels.push({
        price: parseFloat(price.toFixed(2)),
        side,
        quantity: parseFloat(quantity.toFixed(4)),
        status: 'PENDING'
      });
    }

    return [...this.gridLevels];
  }

  // Get current grid levels
  getGridLevels(): GridLevel[] {
    return [...this.gridLevels];
  }

  // Set trading mode (always production now)
  setTradingMode(mode: TradingMode): void {
    this.mode = mode;
  }

  // Start grid trading
  async startTrading(): Promise<boolean> {
    if (!this.gridConfig || this.isRunning) return false;

    this.isRunning = true;
    
    try {
      for (let i = 0; i < this.gridLevels.length; i++) {
        const level = this.gridLevels[i];
        const order = await RealBinanceService.createOrder(
          this.gridConfig.symbol,
          level.side,
          'LIMIT',
          level.quantity,
          level.price
        );
        
        this.gridLevels[i] = {
          ...level,
          orderId: order.id,
          status: 'ACTIVE'
        };
      }
    } catch (error) {
      console.error('Failed to place initial grid orders:', error);
      this.isRunning = false;
      return false;
    }
    
    return true;
  }

  // Stop grid trading
  async stopTrading(): Promise<boolean> {
    if (!this.isRunning) return false;
    
    try {
      for (const level of this.gridLevels) {
        if (level.orderId && level.status === 'ACTIVE') {
          await RealBinanceService.cancelOrder(level.orderId);
        }
      }
    } catch (error) {
      console.error('Failed to cancel grid orders:', error);
      return false;
    }
    
    this.isRunning = false;
    return true;
  }

  // Adjust grid levels dynamically
  async adjustGridLevels(marketData: MarketData): Promise<GridLevel[]> {
    if (!this.isRunning || !this.gridConfig) return this.gridLevels;
    
    const currentPrice = marketData.lastPrice;
    const now = Date.now();
    
    // Only rebalance if threshold time has passed (30 seconds for demo)
    if (now - this.lastRebalance < 30000) {
      return this.gridLevels;
    }
    
    this.lastRebalance = now;
    
    // If price is outside the grid range, consider rebalancing
    if (currentPrice > this.gridConfig.upperPrice || currentPrice < this.gridConfig.lowerPrice) {
      // In a real system, this is where RL would decide on grid adjustments
      const newLowerPrice = Math.max(currentPrice * 0.90, this.gridConfig.lowerPrice * 0.8);
      const newUpperPrice = Math.min(currentPrice * 1.10, this.gridConfig.upperPrice * 1.2);
      
      // Update config
      this.gridConfig = {
        ...this.gridConfig,
        lowerPrice: newLowerPrice,
        upperPrice: newUpperPrice
      };
      
      // Stop trading, reinitialize grid and restart
      await this.stopTrading();
      this.initializeGrid(this.gridConfig);
      await this.startTrading();
    }
    
    return this.gridLevels;
  }

  // Get grid status
  getGridStatus() {
    return {
      isRunning: this.isRunning,
      mode: this.mode,
      config: this.gridConfig,
      levels: this.gridLevels.length
    };
  }
}

// Singleton instance
export const gridService = new GridTradingService();
