
import { GridConfig, GridLevel, Position, TradingMode, MarketData } from '../types/trading';
import { BinanceService } from './binanceService';

// Mock implementation of grid trading logic
export class GridTradingService {
  private gridConfig: GridConfig | null = null;
  private gridLevels: GridLevel[] = [];
  private mode: TradingMode = 'shadow';
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
      // Adjust side based on price relative to current market price
      // This is a simplification - in a real implementation, you'd get the current price from the API
      const currentPrice = (upperPrice + lowerPrice) / 2; // Approximate current price as middle of range
      const side = price < currentPrice ? 'BUY' : 'SELL';
      
      this.gridLevels.push({
        price: parseFloat(price.toFixed(2)),
        side,
        quantity: parseFloat(quantity.toFixed(4)),
        status: 'PENDING'
      });
    }

    // Sort grid levels by price
    this.gridLevels.sort((a, b) => a.price - b.price);

    return [...this.gridLevels];
  }

  // Get current grid levels
  getGridLevels(): GridLevel[] {
    return [...this.gridLevels];
  }

  // Set trading mode
  setTradingMode(mode: TradingMode): void {
    this.mode = mode;
  }

  // Start grid trading
  async startTrading(): Promise<boolean> {
    if (!this.gridConfig || this.isRunning) return false;

    try {
      // Instead of placing individual orders, we'll start the grid trading bot
      // with our configuration
      const gridConfig = {
        symbol: this.gridConfig.symbol,
        config: {
          initial_levels: this.gridConfig.gridLevels,
          initial_spacing_perc: (this.gridConfig.upperPrice - this.gridConfig.lowerPrice) / 
                               (this.gridConfig.upperPrice * this.gridConfig.gridLevels),
          leverage: 1,
          upper_price: this.gridConfig.upperPrice,
          lower_price: this.gridConfig.lowerPrice,
          quantity_per_order: this.gridConfig.quantity
        }
      };

      // Use the first grid level to start the grid (this is a simplification)
      const firstLevel = this.gridLevels[0];
      if (!firstLevel) {
        console.error('No grid levels defined');
        return false;
      }

      // Start the grid trading bot
      await BinanceService.createOrder(
        this.gridConfig.symbol,
        firstLevel.side,
        'LIMIT',
        firstLevel.quantity,
        firstLevel.price
      );

      // Mark all levels as active
      this.gridLevels = this.gridLevels.map(level => ({
        ...level,
        orderId: `${this.mode}-${Date.now()}-${level.price}`,
        status: 'ACTIVE'
      }));

      this.isRunning = true;
      return true;
    } catch (error) {
      console.error('Failed to start grid trading:', error);
      return false;
    }
  }

  // Stop grid trading
  async stopTrading(): Promise<boolean> {
    if (!this.isRunning || !this.gridConfig) return false;
    
    try {
      // Instead of canceling individual orders, we'll stop the grid trading bot
      // We need to create a "fake" orderId that contains the symbol
      const orderId = `${this.mode}-${this.gridConfig.symbol}-${Date.now()}`;
      const success = await BinanceService.cancelOrder(orderId);
      
      if (success) {
        // Mark all levels as inactive
        this.gridLevels = this.gridLevels.map(level => ({
          ...level,
          status: 'CANCELED'
        }));
        
        this.isRunning = false;
        return true;
      } else {
        console.error('Failed to stop grid trading');
        return false;
      }
    } catch (error) {
      console.error('Error stopping grid trading:', error);
      return false;
    }
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
      console.log(`Price ${currentPrice} is outside grid range [${this.gridConfig.lowerPrice}-${this.gridConfig.upperPrice}]. Rebalancing...`);
      
      // In a real system, this is where RL would decide on grid adjustments
      const newLowerPrice = Math.max(currentPrice * 0.90, this.gridConfig.lowerPrice * 0.8);
      const newUpperPrice = Math.min(currentPrice * 1.10, this.gridConfig.upperPrice * 1.2);
      
      // Update config
      this.gridConfig = {
        ...this.gridConfig,
        lowerPrice: newLowerPrice,
        upperPrice: newUpperPrice
      };
      
      try {
        // Stop trading, reinitialize grid and restart
        await this.stopTrading();
        
        // Wait a bit for the backend to process the stop command
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.initializeGrid(this.gridConfig);
        
        // Start trading with the new grid configuration
        const success = await this.startTrading();
        if (success) {
          console.log('Grid successfully rebalanced');
        } else {
          console.error('Failed to restart grid after rebalancing');
        }
      } catch (error) {
        console.error('Error during grid rebalancing:', error);
      }
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
