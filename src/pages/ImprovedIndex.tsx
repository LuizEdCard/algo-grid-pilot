
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
import { RealBinanceService } from '../services/realBinanceService';
import { MarketData, GridLevel } from '../types/trading';

const ImprovedIndex = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [marketData, setMarketData] = useState<MarketData | undefined>();
  const [gridLevels, setGridLevels] = useState<GridLevel[]>([]);
  const [availablePairs, setAvailablePairs] = useState<MarketData[]>([]);
  const [isTrading, setIsTrading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('trading');

  // Fetch real pairs from backend
  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const pairs = await RealBinanceService.getTradingPairs();
        setAvailablePairs(pairs);
        
        const current = pairs.find(p => p.symbol === selectedSymbol);
        if (current) {
          setMarketData(current);
        }
      } catch (error) {
        console.error('Error fetching pairs:', error);
        try {
          const marketResponse = await RealBinanceService.getMarketData();
          setAvailablePairs(marketResponse);
          
          const current = marketResponse.find(p => p.symbol === selectedSymbol);
          if (current) {
            setMarketData(current);
          }
        } catch (fallbackError) {
          console.error('Error fetching market data:', fallbackError);
        }
      }
    };

    fetchPairs();
    const interval = setInterval(fetchPairs, 30000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Generate real grid levels only when bot is active
  useEffect(() => {
    if (marketData && isTrading) {
      const levels: GridLevel[] = [];
      const basePrice = marketData.lastPrice;
      const stepSize = basePrice * 0.01; // 1% steps
      
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
    } else {
      setGridLevels([]);
    }
  }, [marketData, selectedSymbol, isTrading]);

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    toast({
      title: "Par alterado",
      description: `Mudou para ${symbol}`
    });
  };

  const handleStartTrading = async (symbol: string, config?: any) => {
    setIsTrading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
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
          </div>
          
          <div className="flex items-center gap-4">
            <BackendStatus />
          </div>
        </div>

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
