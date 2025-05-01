
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
  stats: TradingStatsType;
}

const TradingStats = ({ stats }: TradingStatsProps) => {
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
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
