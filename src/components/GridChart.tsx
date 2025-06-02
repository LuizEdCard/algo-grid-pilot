
import AdvancedChart from './AdvancedChart';
import { GridLevel, MarketData } from '../types/trading';

interface GridChartProps {
  symbol: string;
  gridLevels: GridLevel[];
  marketData?: MarketData;
  height?: number;
}

const GridChart: React.FC<GridChartProps> = ({ 
  symbol, 
  gridLevels, 
  marketData, 
  height = 600 
}) => {
  return (
    <AdvancedChart
      symbol={symbol}
      gridLevels={gridLevels}
      marketData={marketData}
      height={height}
    />
  );
};

export default GridChart;
