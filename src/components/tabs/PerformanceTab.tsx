
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, TrendingUp, TrendingDown, 
  Target, Clock, BarChart3 
} from 'lucide-react';
import { GridLevel } from '../../types/trading';

interface PerformanceTabProps {
  selectedSymbol: string;
  gridLevels: GridLevel[];
  isTrading: boolean;
}

interface PerformanceData {
  totalTrades: number;
  successRate: number;
  totalPnL: number;
  dailyPnL: number;
  weeklyPnL: number;
  maxDrawdown: number;
  winRate: number;
  avgTradeSize: number;
  sharpeRatio: number;
  activeTime: string;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({
  selectedSymbol,
  gridLevels,
  isTrading
}) => {
  const [performance, setPerformance] = useState<PerformanceData>({
    totalTrades: 142,
    successRate: 78.5,
    totalPnL: 1250.75,
    dailyPnL: 45.30,
    weeklyPnL: 287.50,
    maxDrawdown: -125.40,
    winRate: 68.2,
    avgTradeSize: 85.60,
    sharpeRatio: 1.85,
    activeTime: '2d 14h 32m'
  });

  const [recentTrades, setRecentTrades] = useState([
    { id: 1, type: 'BUY', price: 44850, quantity: 0.001, pnl: 12.5, time: '14:32:15' },
    { id: 2, type: 'SELL', price: 45120, quantity: 0.001, pnl: 25.8, time: '14:28:40' },
    { id: 3, type: 'BUY', price: 44920, quantity: 0.001, pnl: 18.2, time: '14:25:12' },
    { id: 4, type: 'SELL', price: 45080, quantity: 0.001, pnl: 22.1, time: '14:20:55' },
    { id: 5, type: 'BUY', price: 44880, quantity: 0.001, pnl: 15.7, time: '14:18:30' }
  ]);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-12 gap-6">
        {/* PnL Cards */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                PnL Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +${performance.totalPnL.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {performance.totalTrades} trades executados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                PnL Diário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${performance.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performance.dailyPnL >= 0 ? '+' : ''}${performance.dailyPnL.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Métricas de Performance - {selectedSymbol}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                {/* Success Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Taxa de Sucesso</span>
                    <Badge variant={performance.successRate > 70 ? 'default' : 'secondary'}>
                      {performance.successRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={performance.successRate} className="h-2" />
                </div>

                {/* Win Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Win Rate</span>
                    <Badge variant={performance.winRate > 60 ? 'default' : 'secondary'}>
                      {performance.winRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={performance.winRate} className="h-2" />
                </div>

                {/* Sharpe Ratio */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Sharpe Ratio</span>
                  <div className="text-lg font-bold">
                    {performance.sharpeRatio.toFixed(2)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {performance.sharpeRatio > 1.5 ? 'Excelente' : performance.sharpeRatio > 1 ? 'Bom' : 'Regular'}
                  </span>
                </div>

                {/* Max Drawdown */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Max Drawdown</span>
                  <div className="text-lg font-bold text-red-600">
                    ${performance.maxDrawdown.toFixed(2)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Maior perda consecutiva
                  </span>
                </div>

                {/* Average Trade Size */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Tamanho Médio</span>
                  <div className="text-lg font-bold">
                    ${performance.avgTradeSize.toFixed(2)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Por trade
                  </span>
                </div>

                {/* Active Time */}
                <div className="space-y-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Tempo Ativo
                  </span>
                  <div className="text-lg font-bold">
                    {performance.activeTime}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Uptime total
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Trades and Grid Status */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Trades */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Trades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-right p-2">Preço</th>
                      <th className="text-right p-2">Quantidade</th>
                      <th className="text-right p-2">PnL</th>
                      <th className="text-right p-2">Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade) => (
                      <tr key={trade.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                            {trade.type}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-mono">${trade.price.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{trade.quantity.toFixed(3)}</td>
                        <td className={`p-2 text-right font-mono ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                        <td className="p-2 text-right text-sm text-muted-foreground">
                          {trade.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid Status */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Status do Grid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Status:</span>
                <Badge variant={isTrading ? 'default' : 'secondary'}>
                  {isTrading ? 'Ativo' : 'Parado'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Níveis Totais:</span>
                <span className="font-medium">{gridLevels.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Ordens Ativas:</span>
                <span className="font-medium">
                  {gridLevels.filter(level => level.status === 'ACTIVE').length}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Ordens Pendentes:</span>
                <span className="font-medium">
                  {gridLevels.filter(level => level.status === 'PENDING').length}
                </span>
              </div>

              {gridLevels.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm">Range de Preços:</span>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Máximo:</span>
                      <span className="font-mono">${Math.max(...gridLevels.map(l => l.price)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mínimo:</span>
                      <span className="font-mono">${Math.min(...gridLevels.map(l => l.price)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTab;
