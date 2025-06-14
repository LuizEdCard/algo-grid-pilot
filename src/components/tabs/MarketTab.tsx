
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Activity, TrendingUp, Target } from 'lucide-react';
import RecommendedPairs from '../RecommendedPairs';
import TradingStats from '../TradingStats';
import ManualPairSelector from '../ManualPairSelector';
import { MarketData } from '../../types/trading';
import RealFlaskApiService from '../../services/realApiService';
import { toast } from "@/hooks/use-toast";

interface MarketTabProps {
  availablePairs: MarketData[];
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  onPairAdded: (symbol: string) => void;
  lastUpdate: Date;
}

const MarketTab: React.FC<MarketTabProps> = ({
  availablePairs,
  selectedSymbol,
  onSymbolChange,
  onPairAdded,
  lastUpdate
}) => {
  const [recommendedPairs, setRecommendedPairs] = useState<any[]>([]);
  const [tradingPairs, setTradingPairs] = useState<any[]>([]);
  const [liveProfits, setLiveProfits] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch recommended pairs
  const fetchRecommendedPairs = async () => {
    try {
      const response = await RealFlaskApiService.getRecommendedPairs(10);
      console.log('[MarketTab] Recommended pairs:', response);
      setRecommendedPairs(response.recommended_pairs || []);
    } catch (error) {
      console.error('[MarketTab] Erro ao buscar pares recomendados:', error);
      setRecommendedPairs([]);
    }
  };

  // Fetch trading pairs
  const fetchTradingPairs = async () => {
    try {
      const response = await RealFlaskApiService.getTradingPairs();
      console.log('[MarketTab] Trading pairs:', response);
      setTradingPairs(response.active_pairs || []);
    } catch (error) {
      console.error('[MarketTab] Erro ao buscar pares de trading:', error);
      setTradingPairs([]);
    }
  };

  // Fetch live profits
  const fetchLiveProfits = async () => {
    try {
      const response = await RealFlaskApiService.getLiveProfitsSummary('24h');
      console.log('[MarketTab] Live profits:', response);
      setLiveProfits(response.summary);
    } catch (error) {
      console.error('[MarketTab] Erro ao buscar lucros ao vivo:', error);
      setLiveProfits(null);
    }
  };

  useEffect(() => {
    fetchRecommendedPairs();
    fetchTradingPairs();
    fetchLiveProfits();
    
    const interval = setInterval(() => {
      fetchRecommendedPairs();
      fetchTradingPairs(); 
      fetchLiveProfits();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handlePairAdded = async (symbol: string) => {
    setLoading(true);
    try {
      // Verificar se o par já existe
      const existing = availablePairs.find(p => p.symbol === symbol);
      if (existing) {
        toast({
          title: "Par já existe",
          description: `${symbol} já está na lista de pares disponíveis`,
          variant: "default"
        });
        onSymbolChange(symbol);
        return;
      }

      // Buscar dados do mercado para o novo par
      const marketResponse = await RealFlaskApiService.getMarketData();
      const marketPair = marketResponse.tickers?.find((t: any) => t.symbol === symbol);
      
      if (marketPair) {
        onPairAdded(symbol);
        onSymbolChange(symbol);
        toast({
          title: "Par adicionado",
          description: `${symbol} foi adicionado e selecionado`
        });
      } else {
        toast({
          title: "Par não encontrado",
          description: `${symbol} não foi encontrado nos dados de mercado`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[MarketTab] Erro ao adicionar par:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o par",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section - Controls and Stats */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Pares Recomendados por IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendedPairs.length > 0 ? (
                <div className="space-y-2">
                  {recommendedPairs.slice(0, 5).map((pair, index) => (
                    <div
                      key={pair.symbol}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        pair.symbol === selectedSymbol ? 'bg-accent' : 'hover:bg-muted'
                      }`}
                      onClick={() => onSymbolChange(pair.symbol)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pair.symbol}</span>
                        <Badge variant="outline">
                          Score: {pair.score?.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Retorno esperado: {pair.expected_return}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Risco: {pair.risk_level}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Carregando recomendações...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-4">
          <ManualPairSelector onPairAdded={handlePairAdded} />
        </div>
        
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumo de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveProfits ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">P&L Total (24h):</span>
                    <span className={`font-medium ${
                      (liveProfits.total_realized_pnl + liveProfits.total_unrealized_pnl) >= 0 ? 
                      'text-green-600' : 'text-red-600'
                    }`}>
                      ${(liveProfits.total_realized_pnl + liveProfits.total_unrealized_pnl).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de Sucesso:</span>
                    <span className="font-medium text-green-600">
                      {(liveProfits.success_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Trades:</span>
                    <span className="font-medium">
                      {liveProfits.total_trades}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Melhor Performer:</span>
                    <span className="font-medium text-green-600">
                      {liveProfits.best_performer?.symbol} (${liveProfits.best_performer?.pnl?.toFixed(2)})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Carregando dados de performance...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Trading Pairs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pares de Trading Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Símbolo</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-center p-2">Tipo Mercado</th>
                  <th className="text-right p-2">Níveis Grid</th>
                  <th className="text-right p-2">PnL Não Realizado</th>
                  <th className="text-right p-2">Ordens Abertas</th>
                </tr>
              </thead>
              <tbody>
                {tradingPairs.length > 0 ? (
                  tradingPairs.map((pair) => (
                    <tr 
                      key={pair.symbol} 
                      className={`border-b hover:bg-muted/50 cursor-pointer ${
                        pair.symbol === selectedSymbol ? 'bg-blue-50 dark:bg-blue-950' : ''
                      }`}
                      onClick={() => onSymbolChange(pair.symbol)}
                    >
                      <td className="p-2 font-medium">{pair.symbol}</td>
                      <td className="p-2 text-center">
                        <Badge variant={pair.status === 'trading' ? 'default' : 'secondary'}>
                          {pair.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant="outline">
                          {pair.market_type}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">{pair.grid_levels}</td>
                      <td className={`p-2 text-right ${
                        pair.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${pair.unrealized_pnl?.toFixed(2) || '0.00'}
                      </td>
                      <td className="p-2 text-right">{pair.open_orders}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum par de trading ativo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Market Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Dados de Mercado em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Símbolo</th>
                  <th className="text-right p-2">Preço</th>
                  <th className="text-right p-2">Variação 24h</th>
                  <th className="text-right p-2">Volume</th>
                  <th className="text-right p-2">Alta 24h</th>
                  <th className="text-right p-2">Baixa 24h</th>
                </tr>
              </thead>
              <tbody>
                {availablePairs.slice(0, 20).map((pair) => (
                  <tr 
                    key={pair.symbol} 
                    className={`border-b hover:bg-muted/50 cursor-pointer ${
                      pair.symbol === selectedSymbol ? 'bg-blue-50 dark:bg-blue-950' : ''
                    }`}
                    onClick={() => onSymbolChange(pair.symbol)}
                  >
                    <td className="p-2 font-medium">{pair.symbol}</td>
                    <td className="p-2 text-right">
                      ${pair.lastPrice ? pair.lastPrice.toFixed(2) : '0.00'}
                    </td>
                    <td className={`p-2 text-right ${(pair.priceChangePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(pair.priceChangePercent || 0) >= 0 ? '+' : ''}{(pair.priceChangePercent || 0).toFixed(2)}%
                    </td>
                    <td className="p-2 text-right">
                      {pair.volume24h ? (pair.volume24h / 1000000).toFixed(2) : '0.00'}M
                    </td>
                    <td className="p-2 text-right text-green-600">
                      ${pair.high24h ? pair.high24h.toFixed(2) : '0.00'}
                    </td>
                    <td className="p-2 text-right text-red-600">
                      ${pair.low24h ? pair.low24h.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Tempo real
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketTab;
