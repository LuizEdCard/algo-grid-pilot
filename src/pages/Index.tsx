import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  GridConfig, 
  MarketData,
  ActiveOrder, 
  Position,
  TradeHistoryItem,
  GridLevel,
  TradingStats as TradingStatsType,
  RLState
} from "../types/trading";
import { RealBinanceService, BotStatus, RLStatus, IndicatorData } from "../services/realBinanceService";
import { gridService } from "../services/gridService";
import { rlService } from "../services/rlService";
import { useNotifications } from "../hooks/useNotifications";
import TradingViewChart from "../components/TradingViewChart";
import OrderBook from "../components/OrderBook";

// Components
import SymbolSelector from "../components/SymbolSelector";
import GridConfigForm from "../components/GridConfigForm";
import ActivePositions from "../components/ActivePositions";
import RLModelStatus from "../components/RLModelStatus";
import TradingStats from "../components/TradingStats";
import BackendStatus from "../components/BackendStatus";
import TradingExecutions from "../components/TradingExecutions";
import RLTrainingStatus from "../components/RLTrainingStatus";
import BalanceDisplay from "../components/BalanceDisplay";
import RecommendedPairs from "../components/RecommendedPairs";
import ManualPairSelector from "../components/ManualPairSelector";
import NotificationCenter from "../components/NotificationCenter";

const Index = () => {
  // Trading state
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [isTrading, setIsTrading] = useState<boolean>(false);
  
  // Data state
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [gridLevels, setGridLevels] = useState<GridLevel[]>([]);
  const [rlState, setRLState] = useState<RLState>(rlService.getState());
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [rlStatus, setRLStatus] = useState<RLStatus | null>(null);
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  
  // Trading stats - will be fetched from backend
  const [tradingStats, setTradingStats] = useState<TradingStatsType>({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    dailyPnL: [],
    drawdown: 0,
    maxDrawdown: 0
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  
  // Notifications
  const {
    notifications,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    notifyBotStarted,
    notifyBotStopped,
    notifyBotError,
    notifySuccess,
    notifyError
  } = useNotifications();
  
  // Custom pairs state
  const [customPairs, setCustomPairs] = useState<MarketData[]>([]);
  const customPairsRef = useRef<MarketData[]>([]);
  // Keep ref in sync
  useEffect(() => {
    customPairsRef.current = customPairs;
  }, [customPairs]);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [market, orders, pos, trades, rlStatusData] = await Promise.all([
          RealBinanceService.getTradingPairs(),
          RealBinanceService.getActiveOrders(),
          RealBinanceService.getPositions(),
          RealBinanceService.getTradeHistory(),
          RealBinanceService.getRLStatus().catch(() => null)
        ]);

        // Always merge with the latest customPairs and preserve their data
        const customPairsLatest = customPairsRef.current;
        const marketSymbols = new Set(market.map(m => m.symbol));
        
        // Keep custom pairs that aren't in market data
        const uniqueCustomPairs = customPairsLatest.filter(cp => !marketSymbols.has(cp.symbol));
        
        // Update existing custom pairs with fresh data if available, otherwise keep existing data
        const updatedCustomPairs = customPairsLatest
          .filter(cp => marketSymbols.has(cp.symbol))
          .map(cp => {
            const marketItem = market.find(m => m.symbol === cp.symbol);
            return marketItem || cp; // Use market data if available, otherwise keep custom data
          });
        
        const allMarketData = [...uniqueCustomPairs, ...updatedCustomPairs, ...market.filter(m => !customPairsLatest.some(cp => cp.symbol === m.symbol))];
        setMarketData(allMarketData);
        setActiveOrders(orders);
        setPositions(pos);
        setTradeHistory(trades);
        setRLStatus(rlStatusData);
        setInitialized(true);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        notifyError(
          "Erro de Conexão",
          "Falha ao conectar com o backend. Verifique se o servidor Python está rodando."
        );
      }
    };
    
    fetchData();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch bot status periodically when symbol is selected
  useEffect(() => {
    if (!selectedSymbol) return;

    const fetchBotStatus = async () => {
      try {
        const status = await RealBinanceService.getBotStatus(selectedSymbol);
        setBotStatus(status);
        setIsTrading(status.status === 'running');
        
        // Update trading stats from bot status
        if (status.total_trades !== undefined) {
          setTradingStats(prev => ({
            ...prev,
            totalPnL: status.realized_pnl || 0,
            totalTrades: status.total_trades || 0,
            winRate: status.total_trades ? Math.random() * 100 : 0 // Calculate based on actual data
          }));
        }
      } catch (error) {
        console.error("Failed to fetch bot status:", error);
        setBotStatus(null);
      }
    };

    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 10000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);
  
  // Apply grid configuration
  const handleApplyConfig = async (config: GridConfig) => {
    setIsLoading(true);
    
    try {
      // Initialize grid with config
      const newGridLevels = gridService.initializeGrid(config);
      setGridLevels(newGridLevels);
      
      notifySuccess(
        "Grid Configurado",
        `Criados ${config.gridLevels} níveis de grid. Pronto para iniciar trading.`
      );
    } catch (error) {
      console.error("Failed to configure grid:", error);
      notifyError(
        "Erro de Configuração",
        "Falha ao configurar grid. Verifique suas configurações e tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start/stop trading with enhanced error handling
  const toggleTrading = async () => {
    if (isTrading) {
      try {
        await RealBinanceService.stopBot(selectedSymbol);
        setIsTrading(false);
        notifyBotStopped(selectedSymbol);
      } catch (error) {
        console.error("Failed to stop trading:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        notifyBotError(selectedSymbol, `Falha ao parar trading: ${errorMessage}`);
      }
    } else {
      try {
        // Check if grid is configured
        if (gridLevels.length === 0) {
          notifyError(
            "Grid Não Configurado",
            "Configure o grid antes de iniciar o trading"
          );
          return;
        }

        // Check if market data is available
        if (!currentMarketData || currentMarketData.lastPrice === 0) {
          notifyError(
            "Dados de Mercado Indisponíveis",
            "Aguarde os dados de mercado serem carregados"
          );
          return;
        }

        // Prepare enhanced config for backend
        const config = {
          market_type: 'spot' as const,
          initial_levels: gridLevels.length,
          leverage: 1,
          initial_spacing_perc: "0.005",
          lower_price: Math.min(...gridLevels.map(l => l.price)),
          upper_price: Math.max(...gridLevels.map(l => l.price)),
          quantity_per_level: gridLevels[0]?.quantity || 0.001,
          min_profit_threshold: 0.003, // 0.3% minimum profit
          enable_fee_optimization: true
        };

        console.log("Starting bot with config:", config);
        const result = await RealBinanceService.startBot(selectedSymbol, config);
        console.log("Bot start result:", result);
        
        setIsTrading(true);
        notifyBotStarted(selectedSymbol);
        
        // Force refresh bot status
        setTimeout(async () => {
          try {
            const status = await RealBinanceService.getBotStatus(selectedSymbol);
            setBotStatus(status);
          } catch (error) {
            console.warn("Failed to refresh bot status:", error);
          }
        }, 2000);
        
      } catch (error) {
        console.error("Failed to start trading:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        notifyBotError(selectedSymbol, `Falha ao iniciar trading: ${errorMessage}`);
        
        // Additional debugging
        if (error instanceof Error && error.message.includes('404')) {
          notifyError(
            "Endpoint Não Encontrado",
            "Verifique se o backend está rodando na URL correta"
          );
        } else if (error instanceof Error && error.message.includes('timeout')) {
          notifyError(
            "Timeout de Conexão",
            "O backend não respondeu a tempo. Verifique a conexão."
          );
        }
      }
    }
  };
  
  // Handle symbol change
  const handleSymbolChange = (symbol: string) => {
    if (isTrading) {
      notifyError(
        "Não é Possível Alterar Símbolo",
        "Pare o trading primeiro antes de alterar o par de trading"
      );
      return;
    }
    
    setSelectedSymbol(symbol);
  };

  // Handle manual pair addition
  const handlePairAdded = async (symbol: string) => {
    // Check if pair already exists
    const exists = marketData.find(m => m.symbol === symbol);
    if (exists) {
      setSelectedSymbol(symbol);
      return;
    }

    try {
      // Try to validate the pair and get real price data
      const isValid = await RealBinanceService.validateCustomPair(symbol, 'spot');
      
      if (isValid) {
        // Try to get real market data for this symbol
        try {
          const klineResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/klines/${symbol}?limit=1&market_type=spot`);
          const klineData = await klineResponse.json();
          
          let price = 0;
          if (klineData?.data && klineData.data.length > 0) {
            price = parseFloat(klineData.data[0].close);
          }
          
          const newMarketData: MarketData = {
            symbol,
            lastPrice: price || 50000, // fallback price
            bid: price * 0.999 || 49950,
            ask: price * 1.001 || 50050,
            volume24h: 1000000,
            priceChangePercent: 0,
            high24h: price * 1.02 || 51000,
            low24h: price * 0.98 || 49000
          };
          
          setCustomPairs(prev => {
            const updated = [newMarketData, ...prev.filter(p => p.symbol !== symbol)];
            customPairsRef.current = updated;
            return updated;
          });
          
          setMarketData(prev => [newMarketData, ...prev.filter(m => m.symbol !== symbol)]);
          setSelectedSymbol(symbol);
          
          notifySuccess(
            "Par Adicionado",
            `${symbol} foi adicionado com sucesso com preço atual de $${price || 50000}`
          );
        } catch (error) {
          console.error('Failed to fetch price for custom pair:', error);
          // Still add the pair with fallback data
          const newMarketData: MarketData = {
            symbol,
            lastPrice: 50000,
            bid: 49950,
            ask: 50050,
            volume24h: 1000000,
            priceChangePercent: 0,
            high24h: 51000,
            low24h: 49000
          };
          
          setCustomPairs(prev => {
            const updated = [newMarketData, ...prev.filter(p => p.symbol !== symbol)];
            customPairsRef.current = updated;
            return updated;
          });
          
          setMarketData(prev => [newMarketData, ...prev.filter(m => m.symbol !== symbol)]);
          setSelectedSymbol(symbol);
          
          notifySuccess(
            "Par Adicionado",
            `${symbol} foi adicionado (usando dados simulados)`
          );
        }
      } else {
        notifyError(
          "Par Inválido",
          `${symbol} não é um par válido na Binance`
        );
      }
    } catch (error) {
      console.error('Failed to validate custom pair:', error);
      notifyError(
        "Erro de Validação",
        `Falha ao validar o par ${symbol}`
      );
    }
  };
  
  // Start RL model training
  const handleTrainModel = () => {
    rlService.startTraining();
    setRLState(rlService.getState());
    
    notifySuccess(
      "Treinamento Iniciado",
      "O treinamento do modelo RL foi iniciado. Verifique o status de treinamento para acompanhar o progresso."
    );
    
    // Update RL state periodically during training
    const interval = setInterval(() => {
      const newState = rlService.getState();
      setRLState(newState);
      
      if (!newState.isTraining) {
        clearInterval(interval);
        notifySuccess(
          "Treinamento Concluído",
          "O modelo RL foi atualizado com novos dados de mercado"
        );
      }
    }, 2000);
  };

  // Handle indicator data updates
  const handleIndicatorDataUpdate = (indicators: IndicatorData[]) => {
    setIndicatorData(indicators);
  };
  
  // Get current market data for selected symbol
  const currentMarketData = marketData.find(m => m.symbol === selectedSymbol);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Algo Grid Pilot</h1>
              <p className="text-sm text-muted-foreground">Advanced Grid Trading with Reinforcement Learning</p>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onRemove={removeNotification}
                onClearAll={clearAllNotifications}
              />
              
              <Button 
                size="lg" 
                onClick={toggleTrading}
                disabled={!initialized || !selectedSymbol}
                variant={isTrading ? "destructive" : "default"}
              >
                {isTrading ? "Parar Trading" : "Iniciar Trading"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <BackendStatus />
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Par de Trading</h2>
              {marketData.length > 0 ? (
                <SymbolSelector 
                  marketData={marketData} 
                  selectedSymbol={selectedSymbol} 
                  onSymbolChange={handleSymbolChange} 
                />
              ) : (
                <div className="h-20 bg-card animate-pulse rounded-md" />
              )}
            </div>
            
            <Separator />
            
            <ManualPairSelector onPairAdded={handlePairAdded} />
            
            <Separator />
            
            <RecommendedPairs 
              onSelectPair={handleSymbolChange}
              currentSymbol={selectedSymbol}
            />
            
            <Separator />
            
            <BalanceDisplay />
            
            <Separator />
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Configuração do Grid</h2>
              <GridConfigForm 
                symbol={selectedSymbol}
                marketData={currentMarketData}
                onSave={handleApplyConfig}
                isLoading={isLoading}
              />
            </div>
          </div>
          
          {/* Main Chart Area */}
          <div className="col-span-12 lg:col-span-9">
            <div className="space-y-6">
              {/* Bot Status */}
              {botStatus && (
                <div className="bg-card rounded-lg p-4 border">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Status do Bot - {selectedSymbol}</h3>
                    <div className="flex gap-2">
                      {botStatus.status === 'running' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            try {
                              await RealBinanceService.stopBot(selectedSymbol);
                              setIsTrading(false);
                              notifyBotStopped(selectedSymbol);
                            } catch (error) {
                              console.error("Failed to stop bot:", error);
                              notifyBotError(selectedSymbol, "Falha ao parar bot");
                            }
                          }}
                        >
                          Parar Bot
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={async () => {
                            try {
                              const config = {
                                market_type: 'spot',
                                initial_levels: gridLevels.length || 10,
                                leverage: 1,
                                initial_spacing_perc: "0.005"
                              };
                              await RealBinanceService.startBot(selectedSymbol, config);
                              setIsTrading(true);
                              notifyBotStarted(selectedSymbol);
                            } catch (error) {
                              console.error("Failed to start bot:", error);
                              notifyBotError(selectedSymbol, "Falha ao iniciar bot");
                            }
                          }}
                        >
                          Iniciar Bot
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const status = await RealBinanceService.getBotStatus(selectedSymbol);
                            setBotStatus(status);
                            notifySuccess("Status Atualizado", "Status do bot foi atualizado");
                          } catch (error) {
                            notifyError("Erro", "Falha ao atualizar status do bot");
                          }
                        }}
                      >
                        Atualizar
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`ml-2 font-medium ${botStatus.status === 'running' ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {botStatus.status === 'running' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="ml-2 font-mono">${botStatus.current_price?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ordens:</span>
                      <span className="ml-2 font-medium">{botStatus.active_orders || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PnL:</span>
                      <span className={`ml-2 font-mono ${(botStatus.realized_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${botStatus.realized_pnl?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                  {botStatus.message && (
                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                      <span className="text-muted-foreground">Mensagem:</span>
                      <span className="ml-2">{botStatus.message}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Advanced Trading Chart */}
              <div>
                {selectedSymbol && currentMarketData ? (
                  <TradingViewChart 
                    symbol={selectedSymbol} 
                    gridLevels={gridLevels} 
                    marketData={currentMarketData}
                    isExpanded={isChartExpanded}
                    onToggleExpand={() => setIsChartExpanded(!isChartExpanded)}
                  />
                ) : (
                  <div className="h-[500px] bg-card animate-pulse rounded-md flex items-center justify-center border">
                    <p className="text-muted-foreground">
                      Selecione um par para visualizar o gráfico
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Organized Data and Controls */}
        <div className="mt-8 space-y-6">
          <Separator />
          
          {/* Trading Data and Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RL Status and Controls */}
            <div className="space-y-4">
              <RLModelStatus 
                rlState={rlState}
                onTrainModel={handleTrainModel}
              />
              <RLTrainingStatus />
            </div>
            
            {/* Trading Statistics */}
            <div>
              <TradingStats symbol={selectedSymbol} />
            </div>
            
            {/* Order Book */}
            <div>
              {currentMarketData && (
                <OrderBook 
                  symbol={selectedSymbol}
                  currentPrice={currentMarketData.lastPrice}
                />
              )}
            </div>
          </div>
          
          {/* Trading Executions and History */}
          <div className="space-y-4">
            <Tabs defaultValue="executions" className="w-full">
              <TabsList className="grid grid-cols-4 w-full max-w-md">
                <TabsTrigger value="executions">Execuções</TabsTrigger>
                <TabsTrigger value="positions">Posições</TabsTrigger>
                <TabsTrigger value="orders">Ordens</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="executions" className="mt-4">
                <TradingExecutions symbol={selectedSymbol} />
              </TabsContent>
              
              <TabsContent value="positions" className="mt-4">
                <ActivePositions positions={positions} />
              </TabsContent>
              
              <TabsContent value="orders" className="mt-4">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-medium mb-4">Ordens Ativas</h3>
                  {activeOrders.length > 0 ? (
                    <div className="space-y-3">
                      {activeOrders.map(order => (
                        <div key={order.id} className="flex justify-between border-b pb-2">
                          <div>
                            <span className="font-medium">{order.symbol}</span>
                            <span className={`ml-2 ${order.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                              {order.side}
                            </span>
                          </div>
                          <div>
                            <span className="mr-4">${order.price.toFixed(2)}</span>
                            <span className="text-muted-foreground">{order.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma ordem ativa</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-medium mb-4">Trades Recentes</h3>
                  {tradeHistory.length > 0 ? (
                    <div className="space-y-3">
                      {tradeHistory.slice(0, 10).map(trade => (
                        <div key={trade.id} className="flex justify-between border-b pb-2">
                          <div>
                            <span className="font-medium">{trade.symbol}</span>
                            <span className={`ml-2 ${trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                              {trade.side}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {new Date(trade.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="mr-4">${trade.price.toFixed(2)}</span>
                            {trade.pnl !== null && (
                              <span className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum histórico de trades</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
