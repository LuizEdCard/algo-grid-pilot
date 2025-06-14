
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
import api from '../../services/apiService';

const SystemTab = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [operationMode, setOperationMode] = useState<string>('');
  const [storageStats, setStorageStats] = useState<any>(null);
  const [websocketStatus, setWebsocketStatus] = useState<any>(null);
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
        const statusResponse = await api.get('/system/status');
        console.log('[SystemTab] Status response:', statusResponse.data);
        setSystemStatus(statusResponse.data);
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar status do sistema:', error);
        setSystemStatus(null);
      }

      // Balance
      try {
        const balanceResponse = await api.get('/balance/summary');
        console.log('[SystemTab] Balance response:', balanceResponse.data);
        setBalance(balanceResponse.data);
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar saldo:', error);
        setBalance(null);
      }

      // Operation mode
      try {
        const modeResponse = await api.get('/operation_mode');
        console.log('[SystemTab] Mode response:', modeResponse.data);
        setOperationMode(modeResponse.data?.mode || '');
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar modo de operação:', error);
        setOperationMode('');
      }

      // Storage stats
      try {
        const storageResponse = await api.get('/storage/stats');
        console.log('[SystemTab] Storage response:', storageResponse.data);
        setStorageStats(storageResponse.data);
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar estatísticas de armazenamento:', error);
        setStorageStats(null);
      }

      // WebSocket status
      try {
        const wsResponse = await api.get('/websocket/status');
        console.log('[SystemTab] WebSocket response:', wsResponse.data);
        setWebsocketStatus(wsResponse.data);
      } catch (error) {
        console.error('[SystemTab] Erro ao buscar status do WebSocket:', error);
        setWebsocketStatus(null);
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

  const handleOperationModeChange = async (newMode: string) => {
    try {
      console.log('[SystemTab] Alterando modo de operação para:', newMode);
      const response = await api.post('/operation_mode', { mode: newMode });
      console.log('[SystemTab] Modo alterado com sucesso:', response.data);
      
      setOperationMode(newMode);
      toast({
        title: "Modo alterado",
        description: `Modo de operação alterado para ${newMode}`
      });
    } catch (error) {
      console.error('[SystemTab] Erro ao alterar modo de operação:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar modo de operação",
        variant: "destructive"
      });
    }
  };

  const handleStorageCleanup = async () => {
    try {
      console.log('[SystemTab] Iniciando limpeza de armazenamento...');
      const response = await api.post('/storage/cleanup');
      console.log('[SystemTab] Limpeza concluída:', response.data);
      
      toast({
        title: "Limpeza concluída",
        description: "Dados antigos removidos com sucesso"
      });
      fetchSystemData(); // Refresh data
    } catch (error) {
      console.error('[SystemTab] Erro na limpeza de armazenamento:', error);
      toast({
        title: "Erro",
        description: "Falha na limpeza de dados",
        variant: "destructive"
      });
    }
  };

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
          {systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemStatus?.status === 'healthy' ? 'Saudável' : systemStatus?.status || 'Desconhecido'}
                </div>
                <div className="text-sm text-muted-foreground">Status Geral</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {systemStatus?.active_bots || 0}
                </div>
                <div className="text-sm text-muted-foreground">Bots Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {systemStatus?.uptime || '--'}
                </div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              {loading ? 'Carregando status do sistema...' : 'Dados do sistema não disponíveis'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operation Mode Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Controle de Operação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="operation-mode">Modo de Operação</Label>
              <Select value={operationMode} onValueChange={handleOperationModeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="conservative">Conservador</SelectItem>
                  <SelectItem value="aggressive">Agressivo</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Controla o comportamento geral dos algoritmos de trading
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Saldos da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Spot Wallet</div>
                <div className="text-lg font-bold">
                  ${balance.spot_total?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {balance.spot_assets?.length || 0} ativos
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Futures Wallet</div>
                <div className="text-lg font-bold">
                  ${balance.futures_total?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Margin: {balance.futures_margin?.toFixed(2) || '0.00'}%
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

      {/* WebSocket Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Conexões WebSocket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {websocketStatus?.connections ? (
              websocketStatus.connections.map((conn: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{conn.stream}</div>
                    <div className="text-sm text-muted-foreground">{conn.symbol || 'Global'}</div>
                  </div>
                  <Badge variant={conn.status === 'connected' ? 'default' : 'destructive'}>
                    {conn.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                {loading ? 'Verificando conexões...' : 'Dados de conexão WebSocket não disponíveis'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerenciamento de Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storageStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {(storageStats.total_size / (1024 * 1024)).toFixed(1)}MB
                  </div>
                  <div className="text-sm text-muted-foreground">Tamanho Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {storageStats.file_count || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Arquivos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {storageStats.old_files || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Arquivos Antigos</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                {loading ? 'Carregando estatísticas de armazenamento...' : 'Dados de armazenamento não disponíveis'}
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Limpeza Automática</div>
                <div className="text-sm text-muted-foreground">
                  Remove dados com mais de 30 dias
                </div>
              </div>
              <Button onClick={handleStorageCleanup} variant="outline">
                Executar Limpeza
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
