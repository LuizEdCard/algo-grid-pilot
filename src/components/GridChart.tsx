
import AdvancedChart from './AdvancedChart';
import { GridLevel, MarketData } from '../types/trading';

interface GridChartProps {
  symbol: string;
  gridLevels: GridLevel[];
  marketData?: MarketData;
  height?: number;
  onHeightChange?: (height: number) => void;
}

const GridChart: React.FC<GridChartProps> = ({ 
  symbol, 
  gridLevels, 
  marketData, 
  height = 600,
  onHeightChange
}) => {
  return (
    <AdvancedChart
      symbol={symbol}
      gridLevels={gridLevels}
      marketData={marketData}
      height={height}
      onHeightChange={onHeightChange}
    />
  );
};

export default GridChart;
