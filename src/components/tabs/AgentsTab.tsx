
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Brain, Activity, TrendingUp, 
  Clock, CheckCircle, AlertCircle, Play
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import api from '../../services/apiService';

interface Agent {
  name: string;
  status: string;
  last_action: string;
  performance: number;
  decisions_count: number;
}

interface AgentMetrics {
  total_actions: number;
  success_rate: number;
  avg_response_time: number;
  last_active: string;
}

interface AgentDecision {
  timestamp: string;
  action: string;
  context: any;
  result: string;
  confidence: number;
}

const AgentsTab = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [agentHistory, setAgentHistory] = useState<any[]>([]);
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [availableTests, setAvailableTests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Fetch agents list
  const fetchAgents = async () => {
    try {
      console.log('[AgentsTab] Buscando lista de agentes...');
      const response = await api.get('/agents');
      console.log('[AgentsTab] Agents response:', response.data);
      
      setAgents(response.data.agents || []);
      if (response.data.agents?.length > 0 && !selectedAgent) {
        setSelectedAgent(response.data.agents[0].name);
      }
      setConnectionError(false);
    } catch (error) {
      console.error('[AgentsTab] Erro ao buscar agentes:', error);
      setAgents([]);
      setConnectionError(true);
    }
  };

  // Fetch system metrics
  const fetchSystemMetrics = async () => {
    try {
      console.log('[AgentsTab] Buscando métricas do sistema...');
      const response = await api.get('/metrics');
      console.log('[AgentsTab] System metrics response:', response.data);
      setSystemMetrics(response.data);
    } catch (error) {
      console.error('[AgentsTab] Erro ao buscar métricas do sistema:', error);
      setSystemMetrics(null);
    }
  };

  // Fetch agent specific data
  const fetchAgentData = async (agentName: string) => {
    if (!agentName) return;
    
    setLoading(true);
    try {
      console.log(`[AgentsTab] Buscando dados do agente: ${agentName}`);
      
      // Agent metrics
      try {
        const metricsResponse = await api.get(`/agents/${agentName}/metrics`);
        console.log('[AgentsTab] Agent metrics response:', metricsResponse.data);
        setAgentMetrics(metricsResponse.data);
      } catch (error) {
        console.error('[AgentsTab] Erro ao buscar métricas do agente:', error);
        setAgentMetrics(null);
      }

      // Agent history
      try {
        const historyResponse = await api.get(`/agents/${agentName}/history`);
        console.log('[AgentsTab] Agent history response:', historyResponse.data);
        setAgentHistory(historyResponse.data.history || []);
      } catch (error) {
        console.error('[AgentsTab] Erro ao buscar histórico do agente:', error);
        setAgentHistory([]);
      }

      // Agent decisions
      try {
        const decisionsResponse = await api.get(`/agents/${agentName}/decisions`);
        console.log('[AgentsTab] Agent decisions response:', decisionsResponse.data);
        setAgentDecisions(decisionsResponse.data.decisions || []);
      } catch (error) {
        console.error('[AgentsTab] Erro ao buscar decisões do agente:', error);
        setAgentDecisions([]);
      }

    } catch (error) {
      console.error('[AgentsTab] Erro geral ao buscar dados do agente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available tests
  const fetchAvailableTests = async () => {
    try {
      console.log('[AgentsTab] Buscando testes disponíveis...');
      const response = await api.get('/testing/available');
      console.log('[AgentsTab] Available tests response:', response.data);
      setAvailableTests(response.data.tests || []);
    } catch (error) {
      console.error('[AgentsTab] Erro ao buscar testes:', error);
      setAvailableTests([]);
    }
  };

  // Run diagnostic test
  const runTest = async (testName: string) => {
    try {
      console.log(`[AgentsTab] Executando teste: ${testName}`);
      const response = await api.post(`/testing/run/${testName}`);
      console.log('[AgentsTab] Test result:', response.data);
      
      toast({
        title: "Teste executado",
        description: `${testName}: ${response.data.status}`,
        variant: response.data.status === 'passed' ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error(`[AgentsTab] Erro ao executar teste ${testName}:`, error);
      toast({
        title: "Erro",
        description: `Falha ao executar teste ${testName}`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchSystemMetrics();
    fetchAvailableTests();
    
    const interval = setInterval(() => {
      fetchAgents();
      fetchSystemMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentData(selectedAgent);
    }
  }, [selectedAgent]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'idle': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
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
                Não foi possível conectar com o servidor de agentes.
              </div>
              <Button onClick={fetchAgents} disabled={loading}>
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
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sistema Multi-Agente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{agents.length}</div>
              <div className="text-sm text-muted-foreground">Agentes Totais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agents.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {systemMetrics?.total_decisions || 0}
              </div>
              <div className="text-sm text-muted-foreground">Decisões Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {systemMetrics?.avg_performance ? `${(systemMetrics.avg_performance * 100).toFixed(1)}%` : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Performance Média</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Lista de Agentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length > 0 ? (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.name}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedAgent === agent.name ? 'bg-accent' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedAgent(agent.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{agent.name}</div>
                      <Badge variant={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {agent.last_action}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Performance: {(agent.performance * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum agente disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="decisions">Decisões</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas do Agente: {selectedAgent}</CardTitle>
                </CardHeader>
                <CardContent>
                  {agentMetrics ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{agentMetrics.total_actions}</div>
                        <div className="text-sm text-muted-foreground">Ações Totais</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(agentMetrics.success_rate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {agentMetrics.avg_response_time}ms
                        </div>
                        <div className="text-sm text-muted-foreground">Tempo Médio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold">
                          {new Date(agentMetrics.last_active).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Última Atividade</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      {loading ? 'Carregando métricas...' : selectedAgent ? 'Dados de métricas não disponíveis' : 'Selecione um agente'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Ações</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {agentHistory.length > 0 ? (
                      <div className="space-y-2">
                        {agentHistory.map((item, index) => (
                          <div key={index} className="p-2 border rounded">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{item.action}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.details}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        {loading ? 'Carregando histórico...' : 'Nenhum histórico disponível'}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions">
              <Card>
                <CardHeader>
                  <CardTitle>Log de Decisões</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {agentDecisions.length > 0 ? (
                      <div className="space-y-2">
                        {agentDecisions.map((decision, index) => (
                          <div key={index} className="p-2 border rounded">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{decision.action}</div>
                              <Badge variant="outline">
                                {(decision.confidence * 100).toFixed(0)}% confiança
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Resultado: {decision.result}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(decision.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        {loading ? 'Carregando decisões...' : 'Nenhuma decisão registrada'}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Diagnostic Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Testes de Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableTests.map((test) => (
                <div key={test} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{test}</div>
                    <div className="text-sm text-muted-foreground">
                      Teste de integridade do sistema
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => runTest(test)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Nenhum teste de diagnóstico disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentsTab;
