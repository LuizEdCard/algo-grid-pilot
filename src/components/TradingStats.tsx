import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TradingStats as TradingStatsType } from "../types/trading";
import { useEffect, useState } from "react";
import { RealBinanceService } from "../services/realBinanceService";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
}

const StatsCard = ({ title, value, change, description }: StatsCardProps) => (
  <div className="p-4 border rounded-lg bg-card">
    <p className="text-sm text-muted-foreground">{title}</p>
    <div className="flex items-baseline mt-1">
      <h3 className="text-2xl font-bold mr-2">{value}</h3>
      {change !== undefined && (
        <span className={change >= 0 ? "text-profit" : "text-loss"}>
          {change > 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      )}
    </div>
    {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
  </div>
);

interface TradingStatsProps {
  symbol: string;
}

const TradingStats = ({ symbol }: TradingStatsProps) => {
  const [stats, setStats] = useState<TradingStatsType>({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    dailyPnL: [],
    drawdown: 0,
    maxDrawdown: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTradingStats = async () => {
      try {
        setIsLoading(true);
        // Try to get real stats from bot status
        const botStatus = await RealBinanceService.getBotStatus(symbol);
        
        if (botStatus) {
          setStats({
            totalPnL: botStatus.realized_pnl || 0,
            winRate: 0, // Will be calculated from trade history
            totalTrades: botStatus.total_trades || 0,
            dailyPnL: [], // Will be fetched from trade executions
            drawdown: 0,
            maxDrawdown: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch trading stats:', error);
        // Keep stats at zero if no real data available
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      fetchTradingStats();
    }
  }, [symbol]);

  const {
    totalPnL,
    winRate,
    totalTrades,
    drawdown,
    maxDrawdown
  } = stats;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance - {symbol}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance - {symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <StatsCard
            title="Total P&L"
            value={`$${totalPnL.toFixed(2)}`}
            change={totalTrades > 0 ? (totalPnL / totalTrades) * 10 : 0}
            description="Net profit/loss"
          />
          <StatsCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            description={`Based on ${totalTrades} trades`}
          />
          <StatsCard
            title="Drawdown"
            value={`${drawdown.toFixed(2)}%`}
            change={-(maxDrawdown - drawdown)}
            description={`Max: ${maxDrawdown.toFixed(2)}%`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingStats;
