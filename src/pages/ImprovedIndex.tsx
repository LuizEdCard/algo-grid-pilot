import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  TrendingUp, Search, Star, BarChart3, 
  Settings, Activity, DollarSign, Play 
} from 'lucide-react';

// Components
import BinanceStyleChart from '../components/BinanceStyleChart';
import ImprovedGridConfig from '../components/ImprovedGridConfig';
import RecommendedPairs from '../components/RecommendedPairs';
import BackendStatus from '../components/BackendStatus';
import TradingStats from '../components/TradingStats';
import BalanceDisplay from '../components/BalanceDisplay';
import RLModelStatus from '../components/RLModelStatus';

// Services and Types
import { RealBinanceService } from '../services/realBinanceService';
import { MarketData, GridLevel, RLState } from '../types/trading';

const ImprovedIndex = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('ADAUSDT');
  const [marketData, setMarketData] = useState<MarketData | undefined>();
  const [gridLevels, setGridLevels] = useState<GridLevel[]>([]);
  const [availablePairs, setAvailablePairs] = useState<MarketData[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customPair, setCustomPair] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [rlState, setRlState] = useState<RLState>({
    currentModel: 'PPO-v2.1',
    isTraining: false,
    lastTrainingTime: Date.now() - 3600000, // 1 hour ago
    performance: 0.78,
    confidence: 0.85
  });

  // Buscar pares disponíveis
  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const pairs = await RealBinanceService.getTradingPairs();
        setAvailablePairs(pairs);
        
        // Definir dados do símbolo atual
        const current = pairs.find(p => p.symbol === selectedSymbol);
        if (current) {
          setMarketData(current);
        }
      } catch (error) {
        console.error('Erro ao buscar pares:', error);
        // Mock data para desenvolvimento
        const mockData: MarketData = {
          symbol: selectedSymbol,
          lastPrice: selectedSymbol.includes('BTC') ? 45000 : 
                   selectedSymbol.includes('ETH') ? 3200 : 0.45,
          bid: 0,
          ask: 0,
          volume24h: 1000000,
          priceChangePercent: 2.5,
          high24h: 0,
          low24h: 0
        };
        setMarketData(mockData);
      }
    };

    fetchPairs();
    const interval = setInterval(fetchPairs, 30000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Gerar níveis de grid simulados
  useEffect(() => {
    if (marketData) {
      const levels: GridLevel[] = [];
      const basePrice = marketData.lastPrice;
      const stepSize = basePrice * 0.02; // 2% steps
      
      for (let i = -5; i <= 5; i++) {
        if (i !== 0) {
          levels.push({
            id: `grid_${i}`,
            price: basePrice + (stepSize * i),
            side: i < 0 ? 'BUY' : 'SELL',
            status: Math.random() > 0.7 ? 'FILLED' : 'ACTIVE',
            quantity: 100 / Math.abs(i),
            orderId: `order_${i}`
          });
        }
      }
      setGridLevels(levels);
    }
  }, [marketData]);

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    toast({
      title: "Par alterado",
      description: `Mudou para ${symbol}`
    });
  };

  const handleCustomPairSubmit = async () => {
    if (!customPair) return;
    
    const formattedPair = customPair.toUpperCase();
    
    try {
      const isValid = await RealBinanceService.validateCustomPair(formattedPair, 'spot');
      if (isValid) {
        setSelectedSymbol(formattedPair);
        setCustomPair('');
        toast({
          title: "Par customizado adicionado",
          description: `${formattedPair} foi adicionado com sucesso`
        });
      } else {
        toast({
          title: "Par inválido",
          description: `${formattedPair} não foi encontrado`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao validar par",
        description: "Verifique a conexão com o backend",
        variant: "destructive"
      });
    }
  };

  const handleStartTrading = async (symbol: string, config?: any) => {
    setIsTrading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
      toast({
        title: "Trading iniciado",
        description: `Bot grid iniciado para ${symbol}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao iniciar trading",
        description: "Verifique a configuração do backend",
        variant: "destructive"
      });
    } finally {
      setIsTrading(false);
    }
  };

  const handleTrainModel = () => {
    setRlState(prev => ({ ...prev, isTraining: true }));
    // Simulate training
    setTimeout(() => {
      setRlState(prev => ({
        ...prev,
        isTraining: false,
        lastTrainingTime: Date.now(),
        performance: Math.min(0.95, prev.performance + 0.02),
        confidence: Math.min(0.95, prev.confidence + 0.01)
      }));
      toast({
        title: "Modelo retreinado",
        description: "O modelo RL foi atualizado com sucesso"
      });
    }, 3000);
  };

  const filteredPairs = availablePairs.filter(pair =>
    pair.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Grid Trading Bot
            </h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <BackendStatus />
            <RLModelStatus 
              rlState={rlState}
              onTrainModel={handleTrainModel}
            />
          </div>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar esquerda - Seleção de pares e configurações */}
          <div className="col-span-3 space-y-4">
            {/* Seleção de Par */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Seleção de Par</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar par..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredPairs.slice(0, 10).map((pair) => (
                    <div
                      key={pair.symbol}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedSymbol === pair.symbol 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSymbolChange(pair.symbol)}
                    >
                      <div>
                        <div className="font-medium">{pair.symbol}</div>
                        <div className="text-xs opacity-70">
                          ${pair.lastPrice >= 1 ? pair.lastPrice.toFixed(2) : pair.lastPrice.toFixed(6)}
                        </div>
                      </div>
                      <Badge variant={pair.priceChangePercent >= 0 ? 'default' : 'destructive'}>
                        {pair.priceChangePercent >= 0 ? '+' : ''}{pair.priceChangePercent.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: BTCUSDT"
                    value={customPair}
                    onChange={(e) => setCustomPair(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomPairSubmit()}
                  />
                  <Button onClick={handleCustomPairSubmit} size="sm">
                    +
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configuração do Grid */}
            <ImprovedGridConfig
              symbol={selectedSymbol}
              currentPrice={marketData?.lastPrice}
              onStart={(config) => handleStartTrading(selectedSymbol, config)}
              isActive={isTrading}
            />

            {/* Estatísticas */}
            <BalanceDisplay />
          </div>

          {/* Área central - Gráfico */}
          <div className={`${isChartExpanded ? 'col-span-12' : 'col-span-6'} transition-all duration-300`}>
            <BinanceStyleChart
              symbol={selectedSymbol}
              gridLevels={gridLevels}
              marketData={marketData}
              isExpanded={isChartExpanded}
              onToggleExpand={() => setIsChartExpanded(!isChartExpanded)}
              onStartTrading={handleStartTrading}
            />
          </div>

          {/* Sidebar direita - Recomendações e estatísticas */}
          {!isChartExpanded && (
            <div className="col-span-3 space-y-4">
              {/* Pares Recomendados */}
              <RecommendedPairs
                onSelectPair={handleSymbolChange}
                currentSymbol={selectedSymbol}
              />

              {/* Estatísticas de Trading */}
              <TradingStats symbol={selectedSymbol} />

              {/* Informações do mercado */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Informações do Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketData && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Preço atual</span>
                        <span className="font-mono">
                          ${marketData.lastPrice >= 1 ? marketData.lastPrice.toFixed(2) : marketData.lastPrice.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Variação 24h</span>
                        <Badge variant={marketData.priceChangePercent >= 0 ? 'default' : 'destructive'}>
                          {marketData.priceChangePercent >= 0 ? '+' : ''}{marketData.priceChangePercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volume 24h</span>
                        <span>{(marketData.volume24h / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grids ativos</span>
                        <span>{gridLevels.filter(g => g.status === 'ACTIVE').length}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações rápidas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsChartExpanded(true)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Expandir Gráfico
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações Avançadas
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Histórico de Trades
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedIndex;
