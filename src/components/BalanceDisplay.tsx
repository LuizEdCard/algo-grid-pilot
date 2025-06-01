
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RealBinanceService, BalanceSummary } from '../services/realBinanceService';

const BalanceDisplay = () => {
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await RealBinanceService.getBalanceSummary();
        setBalance(data);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Balance information unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Spot USDT</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">${balance.spot_usdt.toFixed(2)}</span>
            <span className={`text-xs ${balance.spot_available ? 'text-green-500' : 'text-red-500'}`}>
              ● {balance.spot_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm">Futures USDT</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">${balance.futures_usdt.toFixed(2)}</span>
            <span className={`text-xs ${balance.futures_available ? 'text-green-500' : 'text-red-500'}`}>
              ● {balance.futures_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;
