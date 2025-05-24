
import { useState, useEffect } from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ReferenceLine, ResponsiveContainer, Area
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
  const [priceHistory, setPriceHistory] = useState<{time: number, open: number, high: number, low: number, close: number, volume: number}[]>([]);
  
  // Simulate price history for the chart with OHLC data
  useEffect(() => {
    if (!marketData) return;
    
    const currentPrice = marketData.lastPrice;
    // Add new price point with OHLC data
    setPriceHistory(prev => {
      // Generate realistic OHLC data
      const time = Date.now();
      const open = prev.length > 0 ? prev[prev.length-1].close : currentPrice;
      const close = currentPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.001);
      const low = Math.min(open, close) * (1 - Math.random() * 0.001);
      const volume = Math.floor(Math.random() * 100) + 50;
      
      const newPoint = { time, open, high, low, close, volume };
      const newHistory = [...prev, newPoint].slice(-100); // Keep last 100 points
      return newHistory;
    });
    
    // Update price every 3 seconds
    const interval = setInterval(() => {
      // Simulate small price movements for OHLC
      const randomChange = (Math.random() - 0.5) * currentPrice * 0.002;
      const newClose = currentPrice + randomChange;
      
      setPriceHistory(prev => {
        const lastPoint = prev.length > 0 ? prev[prev.length-1] : { close: currentPrice };
        const time = Date.now();
        const open = lastPoint.close;
        const close = newClose;
        const high = Math.max(open, close) * (1 + Math.random() * 0.001);
        const low = Math.min(open, close) * (1 - Math.random() * 0.001);
        const volume = Math.floor(Math.random() * 100) + 50;
        
        const newPoint = { time, open, high, low, close, volume };
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
    ...(priceHistory.map(point => point.low)),
    ...(priceHistory.map(point => point.high))
  ];
  
  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;

  return (
    <div className="chart-container w-full bg-card rounded-lg p-4 border border-border">
      <h2 className="text-lg font-semibold mb-4">{symbol} Grid</h2>
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={priceHistory}
          margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={(time) => new Date(time).toLocaleTimeString()}
            height={20}
          />
          <YAxis 
            domain={[minPrice, maxPrice]} 
            tickFormatter={(price) => price.toFixed(2)}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const formattedValue = `$${value.toFixed(2)}`;
              const label = {
                open: 'Open',
                high: 'High',
                low: 'Low',
                close: 'Close',
                volume: 'Volume'
              }[name] || name;
              return [formattedValue, label];
            }}
            labelFormatter={(time) => new Date(time).toLocaleTimeString()}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          />
          
          {/* Candlestick body */}
          <Bar
            dataKey="low"
            fill="transparent"
            stroke="transparent"
            yAxisId={0}
          />
          <Bar
            dataKey="high"
            fill="transparent"
            stroke="transparent"
            yAxisId={0}
          />
          
          {/* Candlestick body */}
          {priceHistory.map((entry, index) => {
            const color = entry.open > entry.close ? '#ef4444' : '#22c55e';
            return (
              <Bar
                key={`candle-${index}`}
                dataKey="open"
                fill={color}
                stroke={color}
                yAxisId={0}
                barSize={8}
                shape={props => {
                  const { x, y, width, height, fill } = props;
                  const closeY = props.y + props.height * (1 - (entry.close - minPrice) / (maxPrice - minPrice));
                  const barHeight = Math.abs(y - closeY);
                  const barY = Math.min(y, closeY);
                  
                  return (
                    <rect
                      x={x - width / 2}
                      y={barY}
                      width={width}
                      height={barHeight || 1} // Ensure at least 1px height
                      fill={fill}
                      stroke={fill}
                    />
                  );
                }}
              />
            );
          })}
          
          {/* Volume bars at the bottom */}
          <Bar
            dataKey="volume"
            fill="#6b7280"
            opacity={0.3}
            yAxisId={1}
          />
          
          {/* Add a second y-axis for volume */}
          <YAxis 
            yAxisId={1}
            orientation="right"
            domain={[0, 'dataMax + 10']}
            tickFormatter={(value) => `${value}`}
            hide
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
          
          {/* Candlestick wicks */}
          {priceHistory.map((entry, index) => {
            const color = entry.open > entry.close ? '#ef4444' : '#22c55e';
            return (
              <Line
                key={`wick-${index}`}
                data={[{
                  time: entry.time,
                  highLow: [entry.low, entry.high]
                }]}
                dataKey="highLow"
                stroke={color}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                yAxisId={0}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GridChart;
