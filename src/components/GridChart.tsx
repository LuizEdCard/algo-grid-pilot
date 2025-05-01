
import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ReferenceLine, ResponsiveContainer 
} from 'recharts';
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
  height = 400 
}) => {
  const [priceHistory, setPriceHistory] = useState<{time: number, price: number}[]>([]);
  
  // Simulate price history for the chart
  useEffect(() => {
    if (!marketData) return;
    
    const currentPrice = marketData.lastPrice;
    // Add new price point
    setPriceHistory(prev => {
      const newPoint = { time: Date.now(), price: currentPrice };
      const newHistory = [...prev, newPoint].slice(-100); // Keep last 100 points
      return newHistory;
    });
    
    // Update price every 3 seconds
    const interval = setInterval(() => {
      // Simulate small price movements
      const randomChange = (Math.random() - 0.5) * currentPrice * 0.002;
      const newPrice = currentPrice + randomChange;
      
      setPriceHistory(prev => {
        const newPoint = { time: Date.now(), price: newPrice };
        const newHistory = [...prev, newPoint].slice(-100); // Keep last 100 points
        return newHistory;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [marketData]);

  // Format grid levels for display
  const formattedGridLevels = gridLevels.map(level => ({
    price: level.price,
    side: level.side,
    status: level.status
  }));
  
  // Get min and max prices for chart domain
  const allPrices = [
    ...gridLevels.map(level => level.price),
    ...(priceHistory.map(point => point.price))
  ];
  
  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;

  return (
    <div className="chart-container w-full bg-card rounded-lg p-4 border border-border">
      <h2 className="text-lg font-semibold mb-4">{symbol} Grid</h2>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={priceHistory}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={(time) => new Date(time).toLocaleTimeString()}
            hide
          />
          <YAxis 
            domain={[minPrice, maxPrice]} 
            tickFormatter={(price) => price.toFixed(2)}
          />
          <Tooltip
            formatter={(value: number) => [
              `$${value.toFixed(2)}`, 'Price'
            ]}
            labelFormatter={(time) => new Date(time).toLocaleTimeString()}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          />
          
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            dot={false} 
            strokeWidth={2} 
          />
          
          {/* Grid level reference lines */}
          {formattedGridLevels.map((level, index) => (
            <ReferenceLine 
              key={`grid-${index}`} 
              y={level.price} 
              stroke={level.side === 'BUY' ? '#22c55e' : '#ef4444'} 
              strokeDasharray={level.status === 'ACTIVE' ? '0' : '3 3'} 
              strokeWidth={1.5}
              label={{ 
                value: `${level.side} $${level.price}`, 
                position: 'insideLeft',
                fill: level.side === 'BUY' ? '#22c55e' : '#ef4444',
                fontSize: 10
              }}
            />
          ))}
          
          {/* Current price reference line */}
          {marketData && (
            <ReferenceLine 
              y={marketData.lastPrice} 
              stroke="#f59e0b" 
              strokeDasharray="3 3" 
              label={{ 
                value: `CURRENT $${marketData.lastPrice}`,
                position: 'insideRight',
                fill: '#f59e0b',
                fontSize: 10
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GridChart;
