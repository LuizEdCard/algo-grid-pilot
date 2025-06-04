
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TradingStats as TradingStatsType } from "../types/trading";

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
  // Mock stats for the given symbol
  const stats: TradingStatsType = {
    totalPnL: 1250.50,
    winRate: 67.5,
    totalTrades: 145,
    dailyPnL: [120, -45, 230, 180, -90, 210, 95],
    drawdown: 8.2,
    maxDrawdown: 12.5
  };

  const {
    totalPnL,
    winRate,
    totalTrades,
    drawdown,
    maxDrawdown
  } = stats;

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
