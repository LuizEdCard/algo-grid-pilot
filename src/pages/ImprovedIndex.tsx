
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  TrendingUp, BarChart3, Settings, Activity, 
  DollarSign, Brain, Target, Globe, Users, Zap, Database, MessageCircle
} from 'lucide-react';

// Tab Components
import TradingTab from '../components/tabs/TradingTab';
import MarketTab from '../components/tabs/MarketTab';
import ChartTab from '../components/tabs/ChartTab';
import AnalysisTab from '../components/tabs/AnalysisTab';
import PerformanceTab from '../components/tabs/PerformanceTab';
import SystemTab from '../components/tabs/SystemTab';
import AgentsTab from '../components/tabs/AgentsTab';
import HftTab from '../components/tabs/HftTab';
import SentimentTab from '../components/tabs/SentimentTab';

// Components
import BackendStatus from '../components/BackendStatus';

// Services and Types
import RealFlaskApiService from '../services/realApiService';
import { MarketData, GridLevel } from '../types/trading';

const ImprovedIndex = () => {
  console.log('[ImprovedIndex] Component initializing...');
  
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [marketData, setMarketData] = useState<MarketData | undefined>();
  const [gridLevels, setGridLevels] = useState<GridLevel[]>([]);
  const [availablePairs, setAvailablePairs] = useState<MarketData[]>([]);
  const [isTrading, setIsTrading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('trading');
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);

  console.log('[ImprovedIndex] State initialized, activeTab:', activeTab);

  // Dados de fallback para quando o backend não estiver disponível
  const createFallbackData = (): MarketData[] => {
    return [
      {
        symbol: 'BTCUSDT',
        lastPrice: 67250.50,
        bid: 67200.00,
        ask: 67300.00,
        volume24h: 1250000000.00,
        priceChangePercent: 2.45,
        high24h: 68000.00,
        low24h: 66500.00
      },
      {
        symbol: 'ETHUSDT',
        lastPrice: 3245.75,
        bid: 3240.00,
        ask: 3250.00,
        volume24h: 850000000.00,
        priceChangePercent: -1.20,
        high24h: 3290.00,
        low24h: 3200.00
      },
      {
        symbol: 'BNBUSDT',
        lastPrice: 635.80,
        bid: 635.50,
        ask: 636.10,
        volume24h: 45000000.00,
        priceChangePercent: 0.85,
        high24h: 640.00,
        low24h: 630.00
      },
      {
        symbol: 'ADAUSDT',
        lastPrice: 0.6290,
        bid: 0.6285,
        ask: 0.6295,
        volume24h: 120000000.00,
        priceChangePercent: 1.50,
        high24h: 0.6350,
        low24h: 0.6200
      }
    ];
  };

  // Verificar disponibilidade do backend e buscar dados
  useEffect(() => {
    console.log('[ImprovedIndex] useEffect triggered for data fetching');
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('[ImprovedIndex] Verificando backend...');
        
        // Tentar verificar se o backend está disponível
        await RealFlaskApiService.checkStatus();
        console.log('[ImprovedIndex] Backend disponível');
        setBackendAvailable(true);
        
        // Buscar dados reais do mercado
        const marketResponse = await RealFlaskApiService.getMarketData(100);
        console.log('[ImprovedIndex] Market data response:', marketResponse);
        
        if (marketResponse?.tickers && marketResponse.tickers.length > 0) {
          const convertedPairs = RealFlaskApiService.convertMarketData(marketResponse);
          console.log('[ImprovedIndex] Converted pairs:', convertedPairs.length, 'pairs');
          
          setAvailablePairs(convertedPairs);
          
          const current = convertedPairs.find(p => p.symbol === selectedSymbol);
          if (current) {
            setMarketData(current);
            console.log('[ImprovedIndex] Set current market data for:', selectedSymbol);
          }
        } else {
          console.log('[ImprovedIndex] Usando dados de fallback (resposta vazia)');
          const fallbackData = createFallbackData();
          setAvailablePairs(fallbackData);
          const current = fallbackData.find(p => p.symbol === selectedSymbol);
          if (current) {
            setMarketData(current);
          }
        }
        
        setLastUpdate(new Date());
        
      } catch (error) {
        console.error('[ImprovedIndex] Erro ao conectar com backend:', error);
        setBackendAvailable(false);
        
        // Usar dados de fallback
        console.log('[ImprovedIndex] Usando dados de fallback (erro de conexão)');
        const fallbackData = createFallbackData();
        setAvailablePairs(fallbackData);
        const current = fallbackData.find(p => p.symbol === selectedSymbol);
        if (current) {
          setMarketData(current);
        }
        
        toast({
          title: "Modo Offline",
          description: "Backend indisponível. Usando dados de demonstração.",
          variant: "default"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Atualizar dados a cada 30 segundos se o backend estiver disponível
    const interval = setInterval(() => {
      if (backendAvailable) {
        fetchData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedSymbol, backendAvailable]);

  // Generate grid levels based on current price and trading status
  useEffect(() => {
    console.log('[ImprovedIndex] Grid levels effect triggered, isTrading:', isTrading, 'marketData:', !!marketData);
    
    if (marketData && isTrading) {
      const levels: GridLevel[] = [];
      const basePrice = marketData.lastPrice;
      const stepSize = basePrice * 0.001; // 0.1% steps
      
      for (let i = -10; i <= 10; i++) {
        if (i !== 0) {
          levels.push({
            id: `grid_${selectedSymbol}_${i}`,
            price: basePrice + (stepSize * i),
            side: i < 0 ? 'BUY' : 'SELL',
            status: 'PENDING',
            quantity: 100 / Math.abs(i),
            orderId: `order_${i}`,
            expectedProfit: (100 / Math.abs(i)) * (basePrice + (stepSize * i)) * 0.001
          });
        }
      }
      setGridLevels(levels);
      console.log('[ImprovedIndex] Generated', levels.length, 'grid levels');
    } else {
      setGridLevels([]);
    }
  }, [marketData, selectedSymbol, isTrading]);

  const handleSymbolChange = (symbol: string) => {
    console.log('[ImprovedIndex] Symbol changing to:', symbol);
    setSelectedSymbol(symbol);
    const current = availablePairs.find(p => p.symbol === symbol);
    if (current) {
      setMarketData(current);
    }
    toast({
      title: "Par alterado",
      description: `Mudou para ${symbol}`
    });
  };

  const handlePairAdded = async (symbol: string) => {
    try {
      console.log('[ImprovedIndex] Adicionando par customizado:', symbol);
      
      if (backendAvailable) {
        // Buscar dados atualizados do mercado
        const marketResponse = await RealFlaskApiService.getMarketData();
        const existingPair = marketResponse?.tickers?.find((t: any) => t.symbol === symbol);
        
        if (existingPair) {
          // Converter e adicionar o par
          const convertedPair = {
            symbol: existingPair.symbol,
            lastPrice: parseFloat(existingPair.price),
            bid: parseFloat(existingPair.price) * 0.9999,
            ask: parseFloat(existingPair.price) * 1.0001,
            volume24h: parseFloat(existingPair.volume_24h),
            priceChangePercent: parseFloat(existingPair.change_24h.replace('%', '')),
            high24h: parseFloat(existingPair.high_24h),
            low24h: parseFloat(existingPair.low_24h)
          };
          
          setAvailablePairs(prev => {
            const filtered = prev.filter(p => p.symbol !== symbol);
            return [...filtered, convertedPair];
          });
          
          toast({
            title: "Par adicionado",
            description: `${symbol} foi adicionado à lista de pares disponíveis`
          });
          return;
        }
      }
      
      // Se não existe nos dados do mercado ou backend indisponível, criar um par básico
      const newPair: MarketData = {
        symbol,
        lastPrice: Math.random() * 1000 + 100, // Preço aleatório para demo
        bid: 0,
        ask: 0,
        volume24h: Math.random() * 1000000,
        priceChangePercent: (Math.random() - 0.5) * 10,
        high24h: 0,
        low24h: 0
      };
      
      // Calcular bid/ask/high/low baseado no preço
      newPair.bid = newPair.lastPrice * 0.9999;
      newPair.ask = newPair.lastPrice * 1.0001;
      newPair.high24h = newPair.lastPrice * 1.05;
      newPair.low24h = newPair.lastPrice * 0.95;
      
      setAvailablePairs(prev => {
        const filtered = prev.filter(p => p.symbol !== symbol);
        return [...filtered, newPair];
      });
      
      toast({
        title: "Par adicionado (demo)",
        description: `${symbol} foi adicionado com dados de demonstração`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('[ImprovedIndex] Erro ao adicionar par customizado:', error);
      toast({
        title: "Erro ao adicionar par",
        description: "Não foi possível adicionar o par",
        variant: "destructive"
      });
    }
  };

  const handleStartTrading = async (symbol: string, config?: any) => {
    setIsTrading(true);
    try {
      console.log('[ImprovedIndex] Iniciando grid trading:', { symbol, config });
      
      if (backendAvailable) {
        const gridConfig = {
          symbol,
          market_type: config?.marketType || 'spot',
          initial_levels: config?.gridLevels || 8,
          spacing_perc: config?.spacing || 0.001,
          capital_usdt: config?.capital || 50
        };
        
        const response = await RealFlaskApiService.startGrid(
          gridConfig.symbol,
          gridConfig.market_type,
          gridConfig.initial_levels,
          gridConfig.spacing_perc,
          gridConfig.capital_usdt
        );
        
        console.log('[ImprovedIndex] Grid iniciado:', response);
        
        toast({
          title: "Trading iniciado",
          description: `Grid trading iniciado para ${symbol}`,
          variant: "default"
        });
      } else {
        // Modo demo
        toast({
          title: "Trading iniciado (DEMO)",
          description: `Grid trading simulado para ${symbol}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('[ImprovedIndex] Erro ao iniciar trading:', error);
      toast({
        title: "Erro ao iniciar trading",
        description: backendAvailable ? 
          "Verifique a configuração e conexão com o backend" : 
          "Backend indisponível - modo demo ativo",
        variant: "destructive"
      });
      setIsTrading(false);
    }
  };

  console.log('[ImprovedIndex] About to render, loading:', loading, 'backendAvailable:', backendAvailable);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-2xl font-semibold">Carregando Grid Trading Bot...</h2>
          <p className="text-muted-foreground">
            {backendAvailable ? 'Conectando com o backend...' : 'Preparando modo offline...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Grid Trading Bot
              {!backendAvailable && (
                <Badge variant="secondary" className="ml-2">DEMO</Badge>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <BackendStatus />
          </div>
        </div>

        {/* Backend Status Alert */}
        {!backendAvailable && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-700">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Modo Demonstração</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Backend indisponível. Usando dados de demonstração. 
                Verifique se o servidor Flask está rodando em http://localhost:5000
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs System */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Mercado
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Análise
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agentes
            </TabsTrigger>
            <TabsTrigger value="hft" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              HFT
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Sentiment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trading" className="mt-6">
            <TradingTab
              selectedSymbol={selectedSymbol}
              marketData={marketData}
              isTrading={isTrading}
              onStartTrading={handleStartTrading}
              onSymbolChange={handleSymbolChange}
            />
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <MarketTab
              availablePairs={availablePairs}
              selectedSymbol={selectedSymbol}
              onSymbolChange={handleSymbolChange}
              onPairAdded={handlePairAdded}
              lastUpdate={lastUpdate}
            />
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <ChartTab
              selectedSymbol={selectedSymbol}
              gridLevels={gridLevels}
              marketData={marketData}
              onSymbolChange={handleSymbolChange}
            />
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <AnalysisTab
              selectedSymbol={selectedSymbol}
              marketData={marketData}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <PerformanceTab
              selectedSymbol={selectedSymbol}
              gridLevels={gridLevels}
              isTrading={isTrading}
            />
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <SystemTab />
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <AgentsTab />
          </TabsContent>

          <TabsContent value="hft" className="mt-6">
            <HftTab />
          </TabsContent>

          <TabsContent value="sentiment" className="mt-6">
            <SentimentTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ImprovedIndex;
