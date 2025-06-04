import { GridConfig, GridLevel, MarketData } from '../types/trading';

export class GridService {
  initializeGrid(config: GridConfig): GridLevel[] {
    const {
      symbol,
      gridLevels,
      upperPrice,
      lowerPrice,
      quantity,
      profitMargin,
      dynamicSpacing
    } = config;

    const levels: GridLevel[] = [];
    const priceRange = upperPrice - lowerPrice;
    const stepSize = priceRange / (gridLevels - 1);

    for (let i = 0; i < gridLevels; i++) {
      const price = lowerPrice + (stepSize * i);
      const isUpperHalf = price > (upperPrice + lowerPrice) / 2;
      
      levels.push({
        id: `grid_${symbol}_${i}`,
        price,
        side: isUpperHalf ? 'SELL' : 'BUY',
        quantity,
        status: 'PENDING',
        expectedProfit: quantity * price * (profitMargin / 100)
      });
    }

    return levels;
  }
}

export const gridService = new GridService();
