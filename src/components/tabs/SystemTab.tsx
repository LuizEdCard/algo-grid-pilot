
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

const SystemTab = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [operationMode, setOperationMode] = useState<string>('');
  const [storageStats, setStorageStats] = useState<any>(null);
  const [websocketStatus, setWebsocketStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch system data
  const fetchSystemData = async () => {
    setLoading(true);
    try {
      // System status
      const statusResponse = await fetch('/api/system/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData);
      }

      // Balance
      const balanceResponse = await fetch('/api/balance/summary');
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData);
      }

      // Operation mode
      const modeResponse = await fetch('/api/operation_mode');
      if (modeResponse.ok) {
        const modeData = await modeResponse.json();
        setOperationMode(modeData.mode || 'normal');
      }

      // Storage stats
      const storageResponse = await fetch('/api/storage/stats');
      if (storageResponse.ok) {
        const storageData = await storageResponse.json();
        setStorageStats(storageData);
      }

      // WebSocket status
      const wsResponse = await fetch('/api/websocket/status');
      if (wsResponse.ok) {
        const wsData = await wsResponse.json();
        setWebsocketStatus(wsData);
      }

    } catch (error) {
      console.error('Erro ao buscar dados do sistema:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do sistema",
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
      const response = await fetch('/api/operation_mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });

      if (response.ok) {
        setOperationMode(newMode);
        toast({
          title: "Modo alterado",
          description: `Modo de operação alterado para ${newMode}`
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar modo de operação",
        variant: "destructive"
      });
    }
  };

  const handleStorageCleanup = async () => {
    try {
      const response = await fetch('/api/storage/cleanup', {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: "Limpeza concluída",
          description: "Dados antigos removidos com sucesso"
        });
        fetchSystemData(); // Refresh data
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha na limpeza de dados",
        variant: "destructive"
      });
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemStatus?.status === 'healthy' ? 'Saudável' : 'Verificando...'}
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
              Carregando dados de saldo...
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
                Verificando conexões...
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
            {storageStats && (
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
