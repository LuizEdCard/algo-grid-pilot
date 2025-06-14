
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, DollarSign, Database, Activity, 
  TrendingUp, Zap, Shield, Monitor 
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import RealFlaskApiService from '../../services/realApiService';

const SystemTab = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [operationMode, setOperationMode] = useState<string>('');
  const [liveSystemStatus, setLiveSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Fetch system data
  const fetchSystemData = async () => {
    setLoading(true);
    setConnectionError(false);
    
    try {
      console.log('[SystemTab] Iniciando busca de dados do sistema...');
      
      // System status
      try {
        const statusResponse = await RealFlaskApiService.getSystemStatus();
        console.log('[SystemTab] Status response:', statusResponse);
        setSystemStatus(statusResponse);
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar status do sistema:', error);
        setSystemStatus(null);
      }

      // System metrics
      try {
        const metricsResponse = await RealFlaskApiService.getSystemMetrics();
        console.log('[SystemTab] Metrics response:', metricsResponse);
        setSystemMetrics(metricsResponse);
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar métricas do sistema:', error);
        setSystemMetrics(null);
      }

      // Balance summary
      try {
        const balanceResponse = await RealFlaskApiService.getBalanceSummary();
        console.log('[SystemTab] Balance response:', balanceResponse);
        setBalance(balanceResponse);
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar saldo:', error);
        setBalance(null);
      }

      // Operation mode
      try {
        const modeResponse = await RealFlaskApiService.getOperationMode();
        console.log('[SystemTab] Mode response:', modeResponse);
        setOperationMode(modeResponse?.mode || '');
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar modo de operação:', error);
        setOperationMode('');
      }

      // Live system status
      try {
        const liveStatusResponse = await RealFlaskApiService.getLiveSystemStatus();
        console.log('[SystemTab] Live status response:', liveStatusResponse);
        setLiveSystemStatus(liveStatusResponse);
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar status ao vivo:', error);
        setLiveSystemStatus(null);
      }

    } catch (error) {
      console.error('[SystemTab] Erro geral na busca de dados:', error);
      setConnectionError(true);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar com o backend. Verifique se o servidor está rodando.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (connectionError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-lg font-medium text-destructive mb-2">
                Erro de Conexão com o Backend
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Não foi possível conectar com o servidor. Verifique se o backend está rodando.
              </div>
              <Button onClick={fetchSystemData} disabled={loading}>
                {loading ? 'Tentando reconectar...' : 'Tentar Novamente'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus?.api_status || 'Offline'}
              </div>
              <div className="text-sm text-muted-foreground">API Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Object.keys(systemStatus?.active_bots || {}).length}
              </div>
              <div className="text-sm text-muted-foreground">Bots Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {systemMetrics?.system?.uptime || 0}s
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {systemMetrics?.system?.active_pairs || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pares Ativos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operation Mode Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Modo de Operação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="operation-mode">Modo Atual:</Label>
              <Badge variant={operationMode === 'Production' ? 'default' : 'secondary'}>
                {operationMode || 'Carregando...'}
              </Badge>
            </div>
            {operationMode && (
              <div className="text-sm text-muted-foreground">
                {operationMode === 'Production' ? 
                  'Trading ao vivo com dinheiro real' : 
                  'Modo de teste/simulação'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumo de Saldos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Total Portfolio</div>
                <div className="text-2xl font-bold">
                  ${balance.total_usdt?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Disponível para Trading</div>
                <div className="text-lg font-bold text-green-600">
                  ${balance.available_for_trading?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Spot Wallet</div>
                <div className="text-lg font-medium">
                  ${balance.spot_usdt?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Futures Wallet</div>
                <div className="text-lg font-medium">
                  ${balance.futures_usdt?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              {loading ? 'Carregando dados de saldo...' : 'Dados de saldo não disponíveis'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {systemMetrics.trading?.total_trades || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemMetrics.trading?.success_rate?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  (systemMetrics.trading?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${systemMetrics.trading?.total_pnl?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-muted-foreground">P&L Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {systemMetrics.cache?.hit_rate?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              {loading ? 'Carregando métricas...' : 'Métricas não disponíveis'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live System Health */}
      {liveSystemStatus?.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status dos Componentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Trading Engine</span>
                  <Badge variant={liveSystemStatus.status.components.trading.status === 'active' ? 'default' : 'secondary'}>
                    {liveSystemStatus.status.components.trading.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Uptime: {liveSystemStatus.status.components.trading.uptime}s
                </div>
              </div>
              
              <div className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">WebSocket</span>
                  <Badge variant={liveSystemStatus.status.components.websocket.status === 'connected' ? 'default' : 'destructive'}>
                    {liveSystemStatus.status.components.websocket.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Latency: {liveSystemStatus.status.components.websocket.latency}ms
                </div>
              </div>
              
              <div className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">AI Agents</span>
                  <Badge variant={liveSystemStatus.status.components.ai_agents.status === 'operational' ? 'default' : 'secondary'}>
                    {liveSystemStatus.status.components.ai_agents.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Decisões/min: {liveSystemStatus.status.components.ai_agents.decisions_per_minute}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchSystemData} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar Dados'}
        </Button>
      </div>
    </div>
  );
};

export default SystemTab;
