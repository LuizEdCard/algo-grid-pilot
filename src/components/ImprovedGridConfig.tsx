
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Grid3X3, TrendingUp, DollarSign, Percent } from 'lucide-react';

interface GridConfig {
  symbol: string;
  gridCount: number;
  priceRange: {
    upper: number;
    lower: number;
  };
  investment: number;
  profitPerGrid: number;
  marketType: 'spot' | 'futures';
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface ImprovedGridConfigProps {
  symbol: string;
  currentPrice?: number;
  onStart: (config: GridConfig) => void;
  isActive?: boolean;
}

const ImprovedGridConfig: React.FC<ImprovedGridConfigProps> = ({
  symbol,
  currentPrice = 0,
  onStart,
  isActive = false
}) => {
  const [config, setConfig] = useState<GridConfig>({
    symbol,
    gridCount: 10,
    priceRange: {
      upper: currentPrice * 1.1,
      lower: currentPrice * 0.9
    },
    investment: 100,
    profitPerGrid: 0.5,
    marketType: 'spot'
  });

  const [autoRange, setAutoRange] = useState(true);

  // Atualizar range automaticamente baseado no preço atual
  React.useEffect(() => {
    if (autoRange && currentPrice > 0) {
      setConfig(prev => ({
        ...prev,
        priceRange: {
          upper: currentPrice * 1.15,
          lower: currentPrice * 0.85
        }
      }));
    }
  }, [currentPrice, autoRange]);

  // Calcular estatísticas do grid
  const calculateGridStats = () => {
    const { gridCount, priceRange, investment, profitPerGrid } = config;
    const range = priceRange.upper - priceRange.lower;
    const stepSize = range / (gridCount - 1);
    const investmentPerGrid = investment / gridCount;
    const totalProfitPotential = gridCount * (investmentPerGrid * profitPerGrid / 100);
    
    return {
      stepSize,
      investmentPerGrid,
      totalProfitPotential,
      maxDrawdown: investment * 0.5 // Estimativa
    };
  };

  const stats = calculateGridStats();

  const handleStart = () => {
    onStart(config);
  };

  const generateGridLevels = () => {
    const levels = [];
    const step = (config.priceRange.upper - config.priceRange.lower) / (config.gridCount - 1);
    
    for (let i = 0; i < config.gridCount; i++) {
      const price = config.priceRange.lower + (step * i);
      levels.push({
        price: price,
        side: price < currentPrice ? 'BUY' : 'SELL',
        status: 'PENDING'
      });
    }
    
    return levels;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Configuração Grid - {symbol}
        </CardTitle>
        {currentPrice > 0 && (
          <div className="text-sm text-muted-foreground">
            Preço atual: ${currentPrice >= 1 ? currentPrice.toFixed(2) : currentPrice.toFixed(6)}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tipo de Mercado */}
        <div className="space-y-2">
          <Label>Tipo de Mercado</Label>
          <Select 
            value={config.marketType} 
            onValueChange={(value: 'spot' | 'futures') => 
              setConfig(prev => ({ ...prev, marketType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spot">Spot</SelectItem>
              <SelectItem value="futures">Futuros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quantidade de Grids */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Quantidade de Grids</Label>
            <Badge variant="outline">{config.gridCount}</Badge>
          </div>
          <Slider
            value={[config.gridCount]}
            onValueChange={(value) => setConfig(prev => ({ ...prev, gridCount: value[0] }))}
            min={2}
            max={164}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>2</span>
            <span>164</span>
          </div>
        </div>

        {/* Range de Preços */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Range de Preços</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="auto-range"
                checked={autoRange}
                onCheckedChange={setAutoRange}
                size="sm"
              />
              <Label htmlFor="auto-range" className="text-xs">Auto</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Limite Superior</Label>
              <Input
                type="number"
                value={config.priceRange.upper}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, upper: parseFloat(e.target.value) || 0 }
                }))}
                disabled={autoRange}
                step="0.000001"
              />
            </div>
            <div>
              <Label className="text-xs">Limite Inferior</Label>
              <Input
                type="number"
                value={config.priceRange.lower}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, lower: parseFloat(e.target.value) || 0 }
                }))}
                disabled={autoRange}
                step="0.000001"
              />
            </div>
          </div>
        </div>

        {/* Investimento */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Investimento Total (USDT)
          </Label>
          <Input
            type="number"
            value={config.investment}
            onChange={(e) => setConfig(prev => ({ ...prev, investment: parseFloat(e.target.value) || 0 }))}
            placeholder="100"
          />
        </div>

        {/* Lucro por Grid */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Lucro por Grid (%)
          </Label>
          <Input
            type="number"
            value={config.profitPerGrid}
            onChange={(e) => setConfig(prev => ({ ...prev, profitPerGrid: parseFloat(e.target.value) || 0 }))}
            placeholder="0.5"
            step="0.1"
          />
        </div>

        {/* Configurações Avançadas para Futuros */}
        {config.marketType === 'futures' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Configurações de Futuros</h4>
              
              <div className="space-y-2">
                <Label>Alavancagem</Label>
                <Select 
                  value={config.leverage?.toString() || '1'} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, leverage: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="20">20x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Stop Loss (%)</Label>
                  <Input
                    type="number"
                    value={config.stopLoss || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) }))}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label className="text-xs">Take Profit (%)</Label>
                  <Input
                    type="number"
                    value={config.takeProfit || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) }))}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Estatísticas */}
        <div className="space-y-3">
          <h4 className="font-medium">Estatísticas Estimadas</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Step Size</div>
              <div className="font-medium">
                ${stats.stepSize >= 1 ? stats.stepSize.toFixed(2) : stats.stepSize.toFixed(6)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Por Grid</div>
              <div className="font-medium">${stats.investmentPerGrid.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Lucro Potencial</div>
              <div className="font-medium text-green-600">${stats.totalProfitPotential.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Drawdown</div>
              <div className="font-medium text-red-600">${stats.maxDrawdown.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2">
          <Button 
            onClick={handleStart} 
            className="w-full"
            disabled={isActive}
            variant={isActive ? 'secondary' : 'default'}
          >
            {isActive ? 'Grid Ativo' : `Iniciar Grid ${symbol}`}
          </Button>
          
          {isActive && (
            <Button variant="destructive" className="w-full">
              Parar Grid
            </Button>
          )}
        </div>

        {/* Preview dos Níveis */}
        <div className="space-y-2">
          <Label>Preview dos Níveis (primeiros 5)</Label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {generateGridLevels().slice(0, 5).map((level, index) => (
              <div key={index} className="flex justify-between items-center text-xs p-2 bg-muted rounded">
                <span>${level.price >= 1 ? level.price.toFixed(2) : level.price.toFixed(6)}</span>
                <Badge variant={level.side === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                  {level.side}
                </Badge>
              </div>
            ))}
            {config.gridCount > 5 && (
              <div className="text-center text-xs text-muted-foreground">
                ... e mais {config.gridCount - 5} níveis
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedGridConfig;
