
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, TrendingUp, Clock, Target, 
  Plus, Minus, Activity, Signal
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface HftStatus {
  status: string;
  active_symbols: string[];
  total_trades: number;
  avg_latency: number;
  last_update: string;
}

interface HftPerformance {
  total_volume: number;
  success_rate: number;
  profit_loss: number;
  trades_per_second: number;
  latency_stats: {
    min: number;
    max: number;
    avg: number;
  };
}

const HftTab = () => {
  const [hftStatus, setHftStatus] = useState<HftStatus | null>(null);
  const [hftPerformance, setHftPerformance] = useState<HftPerformance | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch HFT status
  const fetchHftStatus = async () => {
    try {
      const response = await fetch('/api/hft/status');
      if (response.ok) {
        const data = await response.json();
        setHftStatus(data);
      }
    } catch (error) {
      console.error('Erro ao buscar status HFT:', error);
    }
  };

  // Fetch HFT performance
  const fetchHftPerformance = async () => {
    try {
      const response = await fetch('/api/hft/performance');
      if (response.ok) {
        const data = await response.json();
        setHftPerformance(data);
      }
    } catch (error) {
      console.error('Erro ao buscar performance HFT:', error);
    }
  };

  // Add symbol to HFT
  const addSymbolToHft = async () => {
    if (!newSymbol.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/hft/symbols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add',
          symbol: newSymbol.toUpperCase()
        })
      });

      if (response.ok) {
        toast({
          title: "Símbolo adicionado",
          description: `${newSymbol.toUpperCase()} foi adicionado ao HFT`
        });
        setNewSymbol('');
        fetchHftStatus();
      } else {
        throw new Error('Falha ao adicionar símbolo');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar símbolo ao HFT",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove symbol from HFT
  const removeSymbolFromHft = async (symbol: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/hft/symbols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'remove',
          symbol: symbol
        })
      });

      if (response.ok) {
        toast({
          title: "Símbolo removido",
          description: `${symbol} foi removido do HFT`
        });
        fetchHftStatus();
      } else {
        throw new Error('Falha ao remover símbolo');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover símbolo do HFT",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHftStatus();
    fetchHftPerformance();
    
    const interval = setInterval(() => {
      fetchHftStatus();
      fetchHftPerformance();
    }, 5000); // Update more frequently for HFT
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'idle': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* HFT Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Status do HFT Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge variant={getStatusColor(hftStatus?.status || '')}>
                  {hftStatus?.status || 'Conectando...'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">Status Engine</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {hftStatus?.active_symbols?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Símbolos Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {hftStatus?.total_trades || 0}
              </div>
              <div className="text-sm text-muted-foreground">Trades Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {hftStatus?.avg_latency || 0}ms
              </div>
              <div className="text-sm text-muted-foreground">Latência Média</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hftPerformance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${hftPerformance.total_volume?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-muted-foreground">Volume Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(hftPerformance.success_rate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  hftPerformance.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${hftPerformance.profit_loss?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-muted-foreground">P&L</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {hftPerformance.trades_per_second?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-muted-foreground">Trades/seg</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Carregando métricas de performance...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latency Statistics */}
      {hftPerformance?.latency_stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Estatísticas de Latência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {hftPerformance.latency_stats.min}ms
                </div>
                <div className="text-sm text-muted-foreground">Mínima</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {hftPerformance.latency_stats.avg}ms
                </div>
                <div className="text-sm text-muted-foreground">Média</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {hftPerformance.latency_stats.max}ms
                </div>
                <div className="text-sm text-muted-foreground">Máxima</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Symbol Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Symbol */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Símbolo ao HFT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-symbol">Símbolo</Label>
                <Input
                  id="new-symbol"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="Ex: BTCUSDT"
                  className="uppercase"
                />
              </div>
              <Button 
                onClick={addSymbolToHft} 
                disabled={loading || !newSymbol.trim()}
                className="w-full"
              >
                {loading ? 'Adicionando...' : 'Adicionar ao HFT'}
              </Button>
              <div className="text-xs text-muted-foreground">
                O símbolo será validado antes de ser adicionado ao engine HFT
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Symbols */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Símbolos Ativos no HFT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              {hftStatus?.active_symbols?.length ? (
                <div className="space-y-2">
                  {hftStatus.active_symbols.map((symbol) => (
                    <div
                      key={symbol}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{symbol}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeSymbolFromHft(symbol)}
                        disabled={loading}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum símbolo ativo no HFT
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Updates Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signal className="h-5 w-5" />
            Informações em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Atualização automática:</span>
              <Badge variant="default">Ativa (5s)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Última atualização:</span>
              <span className="text-sm text-muted-foreground">
                {hftStatus?.last_update ? 
                  new Date(hftStatus.last_update).toLocaleTimeString() : 
                  'Aguardando dados...'
                }
              </span>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              Os dados HFT são atualizados em tempo real para garantir precisão nas operações de alta frequência.
              A latência é crítica para o sucesso das estratégias HFT.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HftTab;
