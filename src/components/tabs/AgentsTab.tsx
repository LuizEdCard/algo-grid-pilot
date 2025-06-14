
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

  // Fetch agents list
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        if (data.agents?.length > 0 && !selectedAgent) {
          setSelectedAgent(data.agents[0].name);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
    }
  };

  // Fetch system metrics
  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas do sistema:', error);
    }
  };

  // Fetch agent specific data
  const fetchAgentData = async (agentName: string) => {
    if (!agentName) return;
    
    setLoading(true);
    try {
      // Agent metrics
      const metricsResponse = await fetch(`/api/agents/${agentName}/metrics`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setAgentMetrics(metricsData);
      }

      // Agent history
      const historyResponse = await fetch(`/api/agents/${agentName}/history`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setAgentHistory(historyData.history || []);
      }

      // Agent decisions
      const decisionsResponse = await fetch(`/api/agents/${agentName}/decisions`);
      if (decisionsResponse.ok) {
        const decisionsData = await decisionsResponse.json();
        setAgentDecisions(decisionsData.decisions || []);
      }

    } catch (error) {
      console.error('Erro ao buscar dados do agente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available tests
  const fetchAvailableTests = async () => {
    try {
      const response = await fetch('/api/testing/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableTests(data.tests || []);
      }
    } catch (error) {
      console.error('Erro ao buscar testes:', error);
    }
  };

  // Run diagnostic test
  const runTest = async (testName: string) => {
    try {
      const response = await fetch(`/api/testing/run/${testName}`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Teste executado",
          description: `${testName}: ${result.status}`,
          variant: result.status === 'passed' ? 'default' : 'destructive'
        });
      }
    } catch (error) {
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
                      {loading ? 'Carregando métricas...' : 'Selecione um agente'}
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
                        Nenhum histórico disponível
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
                        Nenhuma decisão registrada
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentsTab;
