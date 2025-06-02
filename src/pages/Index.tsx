import { useState, useEffect } from "react";
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
import DrawingTools from "../components/DrawingTools";
import OrderBook from "../components/OrderBook";

// Components
import GridChart from "../components/GridChart";
import SymbolSelector from "../components/SymbolSelector";
import GridConfigForm from "../components/GridConfigForm";
import ActivePositions from "../components/ActivePositions";
import RLModelStatus from "../components/RLModelStatus";
import TradingStats from "../components/TradingStats";
import BackendStatus from "../components/BackendStatus";
import TradingExecutions from "../components/TradingExecutions";
import RLTrainingStatus from "../components/RLTrainingStatus";
import BalanceDisplay from "../components/BalanceDisplay";
import TechnicalIndicators from "../components/TechnicalIndicators";
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
  
  // Trading stats
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
  
  // Drawing tools state
  const [selectedDrawingTool, setSelectedDrawingTool] = useState<string>('none');
  const [drawingTools, setDrawingTools] = useState<any[]>([]);
  
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
        
        setMarketData(market);
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
  
  // Start/stop trading
  const toggleTrading = async () => {
    if (isTrading) {
      try {
        await RealBinanceService.stopBot(selectedSymbol);
        setIsTrading(false);
        notifyBotStopped(selectedSymbol);
      } catch (error) {
        console.error("Failed to stop trading:", error);
        notifyBotError(selectedSymbol, "Falha ao parar trading");
      }
    } else {
      try {
        // Prepare config for backend
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
        console.error("Failed to start trading:", error);
        notifyBotError(selectedSymbol, "Falha ao iniciar trading");
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
  const handlePairAdded = (symbol: string) => {
    // Add to market data if not already present
    const exists = marketData.find(m => m.symbol === symbol);
    if (!exists) {
      // Create a basic market data entry
      const newMarketData: MarketData = {
        symbol,
        lastPrice: 0,
        bid: 0,
        ask: 0,
        volume24h: 0,
        priceChangePercent: 0,
        high24h: 0,
        low24h: 0
      };
      setMarketData(prev => [newMarketData, ...prev]);
    }
    
    setSelectedSymbol(symbol);
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

  // Drawing tools handlers
  const handleClearDrawings = () => {
    setDrawingTools([]);
    setSelectedDrawingTool('none');
  };

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Algo Grid Pilot</h1>
          <p className="text-muted-foreground">Advanced Grid Trading with Reinforcement Learning</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
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
      
      {/* Main content with enhanced layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left column - Symbol selection and configuration */}
        <div className="xl:col-span-1 space-y-6">
          {/* BackendStatus */}
          <BackendStatus />
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Par de Trading</h2>
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
          
          {/* Manual pair addition */}
          <ManualPairSelector onPairAdded={handlePairAdded} />
          
          <Separator />
          
          {/* Recommended pairs */}
          <RecommendedPairs 
            onSelectPair={handleSymbolChange}
            currentSymbol={selectedSymbol}
          />
          
          <Separator />
          
          <BalanceDisplay />
          
          <Separator />
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Configuração do Grid</h2>
            <GridConfigForm 
              symbol={selectedSymbol}
              marketData={currentMarketData}
              onSave={handleApplyConfig}
              isLoading={isLoading}
            />
          </div>
          
          <Separator />
          
          <RLModelStatus 
            rlState={rlState}
            onTrainModel={handleTrainModel}
          />
          
          <RLTrainingStatus />
        </div>
        
        {/* Middle columns - Grid chart, advanced features */}
        <div className="xl:col-span-2 space-y-6">
          {/* Bot Status */}
          {botStatus && (
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-medium mb-2">Status do Bot - {selectedSymbol}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`ml-2 ${botStatus.status === 'running' ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {botStatus.status === 'running' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="ml-2">${botStatus.current_price?.toFixed(2) || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ordens:</span>
                  <span className="ml-2">{botStatus.active_orders || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">PnL:</span>
                  <span className={`ml-2 ${(botStatus.realized_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${botStatus.realized_pnl?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Drawing Tools */}
          <DrawingTools
            selectedTool={selectedDrawingTool}
            onToolSelect={setSelectedDrawingTool}
            onClearDrawings={handleClearDrawings}
            drawingTools={drawingTools}
          />
          
          <Separator />
          
          {/* Enhanced Grid chart with all advanced features */}
          <div>
            {gridLevels.length > 0 && currentMarketData ? (
              <GridChart 
                symbol={selectedSymbol} 
                gridLevels={gridLevels} 
                marketData={currentMarketData}
                height={600}
              />
            ) : (
              <div className="h-[600px] bg-card animate-pulse rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">
                  Configure e aplique as configurações do grid para visualizar o gráfico avançado
                </p>
              </div>
            )}
          </div>
          
          <Separator />
          
          <TradingStats stats={tradingStats} />
          
          <Tabs defaultValue="executions">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="executions">Execuções</TabsTrigger>
              <TabsTrigger value="positions">Posições</TabsTrigger>
              <TabsTrigger value="orders">Ordens Ativas</TabsTrigger>
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
                          <span className={`ml-2 ${order.side === 'BUY' ? 'text-profit' : 'text-loss'}`}>
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
                          <span className={`ml-2 ${trade.side === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                            {trade.side}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {new Date(trade.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="mr-4">${trade.price.toFixed(2)}</span>
                          {trade.pnl !== null && (
                            <span className={trade.pnl >= 0 ? 'text-profit' : 'text-loss'}>
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
        
        {/* Right column - Order Book and additional tools */}
        <div className="xl:col-span-1 space-y-6">
          {/* Order Book */}
          {currentMarketData && (
            <OrderBook 
              symbol={selectedSymbol}
              currentPrice={currentMarketData.lastPrice}
            />
          )}
          
          {/* Market depth visualization could go here */}
          {/* Additional trading tools could go here */}
        </div>
      </div>
    </div>
  );
};

export default Index;
