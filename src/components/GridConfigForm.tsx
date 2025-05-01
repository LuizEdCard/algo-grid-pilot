
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { GridConfig, MarketData } from '../types/trading';
import { rlService } from '../services/rlService';

interface GridConfigFormProps {
  symbol: string;
  marketData?: MarketData;
  initialConfig?: Partial<GridConfig>;
  onSave: (config: GridConfig) => void;
  isLoading?: boolean;
}

const GridConfigForm = ({ 
  symbol, 
  marketData, 
  initialConfig,
  onSave,
  isLoading = false
}: GridConfigFormProps) => {
  const [config, setConfig] = useState<GridConfig>({
    symbol,
    leverage: 1,
    gridLevels: 5,
    upperPrice: 0,
    lowerPrice: 0,
    quantity: 0.01,
    profitMargin: 0.1, // 0.1%
    dynamicSpacing: true,
    rebalanceThreshold: 25, // ADX threshold
  });
  
  const [useRL, setUseRL] = useState(true);
  const [isRLCalculating, setIsRLCalculating] = useState(false);
  
  // Update config when symbol or market data changes
  useEffect(() => {
    if (!marketData) return;
    
    // Calculate reasonable default values based on current price
    const currentPrice = marketData.lastPrice;
    
    // Initial range of 2% above and below current price
    const newConfig = {
      ...config,
      symbol,
      upperPrice: parseFloat((currentPrice * 1.02).toFixed(2)),
      lowerPrice: parseFloat((currentPrice * 0.98).toFixed(2)),
    };
    
    setConfig(newConfig);
    
    // Use RL to suggest grid parameters
    if (useRL) {
      applyRLSuggestions();
    }
  }, [symbol, marketData]);
  
  // Apply initial config if provided
  useEffect(() => {
    if (initialConfig) {
      setConfig(prev => ({
        ...prev,
        ...initialConfig,
      }));
    }
  }, [initialConfig]);
  
  // Get RL suggestions for grid parameters
  const applyRLSuggestions = async () => {
    if (!marketData || !useRL) return;
    
    setIsRLCalculating(true);
    try {
      const suggestions = await rlService.predictGridParameters(
        symbol, 
        [marketData], 
        marketData.lastPrice
      );
      
      setConfig(prev => ({
        ...prev,
        upperPrice: suggestions.upperPrice,
        lowerPrice: suggestions.lowerPrice,
        gridLevels: suggestions.levels,
      }));
    } catch (error) {
      console.error('Failed to get RL suggestions:', error);
    } finally {
      setIsRLCalculating(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };
  
  // Update a config field
  const updateConfig = <K extends keyof GridConfig>(
    key: K, 
    value: GridConfig[K]
  ) => {
    setConfig({...config, [key]: value});
  };
  
  // Calculate grid metrics
  const calculateGridMetrics = () => {
    const { upperPrice, lowerPrice, gridLevels } = config;
    const priceRange = upperPrice - lowerPrice;
    const priceStep = priceRange / gridLevels;
    const potentialProfit = (priceStep * gridLevels * config.profitMargin / 100).toFixed(2);
    
    return {
      priceStep: priceStep.toFixed(2),
      potentialProfit
    };
  };
  
  const { priceStep, potentialProfit } = calculateGridMetrics();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grid Configuration - {symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="mb-4">
                <Label htmlFor="useRL" className="flex items-center justify-between">
                  <span>Use RL for grid parameters</span>
                  <Switch 
                    id="useRL" 
                    checked={useRL} 
                    onCheckedChange={(checked) => setUseRL(checked)}
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Let the AI suggest optimal grid parameters based on market conditions
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="upperPrice">Upper Price ($)</Label>
                  <Input 
                    id="upperPrice" 
                    type="number" 
                    value={config.upperPrice} 
                    onChange={(e) => updateConfig('upperPrice', parseFloat(e.target.value))}
                    step={0.01}
                    disabled={useRL && isRLCalculating}
                  />
                </div>
                
                <div>
                  <Label htmlFor="lowerPrice">Lower Price ($)</Label>
                  <Input 
                    id="lowerPrice" 
                    type="number" 
                    value={config.lowerPrice} 
                    onChange={(e) => updateConfig('lowerPrice', parseFloat(e.target.value))}
                    step={0.01}
                    disabled={useRL && isRLCalculating}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <Label htmlFor="gridLevels">Grid Levels: {config.gridLevels}</Label>
                <Slider 
                  id="gridLevels"
                  min={3}
                  max={20}
                  step={1}
                  value={[config.gridLevels]}
                  onValueChange={(value) => updateConfig('gridLevels', value[0])}
                  disabled={useRL && isRLCalculating}
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity per Grid</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  value={config.quantity} 
                  onChange={(e) => updateConfig('quantity', parseFloat(e.target.value))}
                  step={0.001}
                />
              </div>
              
              <div>
                <Label htmlFor="leverage">Leverage: {config.leverage}x</Label>
                <Slider 
                  id="leverage"
                  min={1}
                  max={20}
                  step={1}
                  value={[config.leverage]}
                  onValueChange={(value) => updateConfig('leverage', value[0])}
                />
              </div>
              
              <div>
                <Label htmlFor="profitMargin">Profit Margin (%): {config.profitMargin.toFixed(2)}%</Label>
                <Slider 
                  id="profitMargin"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={[config.profitMargin]}
                  onValueChange={(value) => updateConfig('profitMargin', value[0])}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-2 text-sm">
            <div>
              <p>Grid step size: <span className="font-medium">${priceStep}</span></p>
              <p>Levels: <span className="font-medium">{config.gridLevels}</span></p>
            </div>
            <div>
              <p>Potential profit per cycle: <span className="font-medium text-profit">${potentialProfit}</span></p>
              <p>Dynamic spacing: <span className="font-medium">{config.dynamicSpacing ? 'Enabled' : 'Disabled'}</span></p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => applyRLSuggestions()} disabled={!useRL || isRLCalculating}>
          {isRLCalculating ? 'Calculating...' : 'Get AI Recommendations'}
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save & Apply'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GridConfigForm;
