
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RealBinanceService, TradeExecution } from '../services/realBinanceService';

interface TradingExecutionsProps {
  symbol: string;
}

const TradingExecutions = ({ symbol }: TradingExecutionsProps) => {
  const [executions, setExecutions] = useState<TradeExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExecutions = async () => {
      if (!symbol) return;
      
      setIsLoading(true);
      try {
        const data = await RealBinanceService.getTradeExecutions(symbol);
        setExecutions(data);
      } catch (error) {
        console.error('Failed to fetch trade executions:', error);
        setExecutions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExecutions();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchExecutions, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Executions - {symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No trade executions yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.slice(0, 10).map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell className="text-xs">
                    {new Date(execution.timestamp * 1000).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <span className={execution.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                      {execution.side.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>${execution.price.toFixed(2)}</TableCell>
                  <TableCell>{execution.qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingExecutions;
