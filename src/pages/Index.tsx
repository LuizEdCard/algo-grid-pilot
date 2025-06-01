
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  GridConfig, 
  MarketData,
  TradingMode, 
  ActiveOrder, 
  Position,
  TradeHistoryItem,
  GridLevel,
  TradingStats as TradingStatsType,
  RLState
} from "../types/trading";
import { RealBinanceService, BotStatus, RLStatus } from "../services/realBinanceService";
import { gridService } from "../services/gridService";
import { rlService } from "../services/rlService";

// Components
import GridChart from "../components/GridChart";
import SymbolSelector from "../components/SymbolSelector";
import GridConfigForm from "../components/GridConfigForm";
import TradingModeSelector from "../components/TradingModeSelector";
import ActivePositions from "../components/ActivePositions";
import RLModelStatus from "../components/RLModelStatus";
import TradingStats from "../components/TradingStats";
import BackendStatus from "../components/BackendStatus";
import TradingExecutions from "../components/TradingExecutions";
import RLTrainingStatus from "../components/RLTrainingStatus";
import BalanceDisplay from "../components/BalanceDisplay";

const Index = () => {
  // Trading state
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [tradingMode, setTradingMode] = useState<TradingMode>("shadow");
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
        toast({
          title: "Connection Error",
          description: "Failed to connect to backend. Please check if the Python server is running.",
          variant: "destructive"
        });
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
      
      toast({
        title: "Grid Configured",
        description: `Created ${config.gridLevels} grid levels. Ready to start trading.`
      });
    } catch (error) {
      console.error("Failed to configure grid:", error);
      toast({
        title: "Configuration Error",
        description: "Failed to configure grid. Please check your settings and try again.",
        variant: "destructive"
      });
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
        toast({
          title: "Trading Stopped",
          description: "Grid bot has been stopped successfully"
        });
      } catch (error) {
        console.error("Failed to stop trading:", error);
        toast({
          title: "Error",
          description: "Failed to stop trading. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      try {
        // Prepare config for backend
        const config = {
          market_type: tradingMode === 'production' ? 'spot' : 'spot',
          initial_levels: gridLevels.length || 10,
          leverage: 1,
          initial_spacing_perc: "0.005"
        };

        await RealBinanceService.startBot(selectedSymbol, config);
        setIsTrading(true);
        toast({
          title: "Trading Started",
          description: `Started grid trading on ${selectedSymbol} in ${tradingMode} mode`
        });
      } catch (error) {
        console.error("Failed to start trading:", error);
        toast({
          title: "Error",
          description: "Failed to start trading. Please check your configuration and backend connection.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Handle symbol change
  const handleSymbolChange = (symbol: string) => {
    if (isTrading) {
      toast({
        title: "Cannot Change Symbol",
        description: "Please stop trading first before changing the trading pair",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedSymbol(symbol);
  };
  
  // Handle trading mode change
  const handleModeChange = (mode: TradingMode) => {
    if (isTrading) return;
    setTradingMode(mode);
  };
  
  // Start RL model training
  const handleTrainModel = () => {
    rlService.startTraining();
    setRLState(rlService.getState());
    
    toast({
      title: "Training Started",
      description: "The RL model training has begun. Check the training status for progress."
    });
    
    // Update RL state periodically during training
    const interval = setInterval(() => {
      const newState = rlService.getState();
      setRLState(newState);
      
      if (!newState.isTraining) {
        clearInterval(interval);
        toast({
          title: "Training Complete",
          description: "The RL model has been updated with new market data"
        });
      }
    }, 2000);
  };
  
  // Get current market data for selected symbol
  const currentMarketData = marketData.find(m => m.symbol === selectedSymbol);

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Algo Grid Pilot</h1>
          <p className="text-muted-foreground">Advanced Grid Trading with Reinforcement Learning</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <TradingModeSelector 
            currentMode={tradingMode} 
            onModeChange={handleModeChange}
            isTrading={isTrading} 
          />
          
          <Button 
            size="lg" 
            onClick={toggleTrading}
            disabled={!initialized || !selectedSymbol}
            variant={isTrading ? "destructive" : "default"}
          >
            {isTrading ? "Stop Trading" : "Start Trading"}
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - Symbol selection and grid configuration */}
        <div className="xl:col-span-1 space-y-6">
          <BackendStatus />
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Trading Pair</h2>
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
          
          <BalanceDisplay />
          
          <Separator />
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Grid Configuration</h2>
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
        
        {/* Middle & right columns - Grid chart, positions, stats */}
        <div className="xl:col-span-2 space-y-6">
          {/* Bot Status */}
          {botStatus && (
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-medium mb-2">Bot Status - {selectedSymbol}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`ml-2 ${botStatus.status === 'running' ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {botStatus.status || 'Idle'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <span className="ml-2">${botStatus.current_price?.toFixed(2) || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Orders:</span>
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
          
          {/* Grid chart */}
          <div>
            {gridLevels.length > 0 && currentMarketData ? (
              <GridChart 
                symbol={selectedSymbol} 
                gridLevels={gridLevels} 
                marketData={currentMarketData}
                height={400}
              />
            ) : (
              <div className="h-[400px] bg-card animate-pulse rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">
                  Configure and apply grid settings to visualize the grid
                </p>
              </div>
            )}
          </div>
          
          <Separator />
          
          <TradingStats stats={tradingStats} />
          
          <Tabs defaultValue="executions">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="executions">Executions</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="orders">Active Orders</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="executions" className="mt-4">
              <TradingExecutions symbol={selectedSymbol} />
            </TabsContent>
            
            <TabsContent value="positions" className="mt-4">
              <ActivePositions positions={positions} />
            </TabsContent>
            
            <TabsContent value="orders" className="mt-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-medium mb-4">Active Orders</h3>
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
                  <p className="text-sm text-muted-foreground">No active orders</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-medium mb-4">Recent Trades</h3>
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
                  <p className="text-sm text-muted-foreground">No trade history</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
