
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ExternalLink, Grid3X3, TrendingUp, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GridLevel, MarketData } from '../../types/trading';

interface ChartTabProps {
  selectedSymbol: string;
  gridLevels: GridLevel[];
  marketData?: MarketData;
  onSymbolChange: (symbol: string) => void;
}

const ChartTab: React.FC<ChartTabProps> = ({
  selectedSymbol,
  gridLevels,
  marketData,
  onSymbolChange
}) => {
  const [showGridLevels, setShowGridLevels] = useState(true);
  const [chartHeight, setChartHeight] = useState(600);

  const openTradingView = () => {
    const tvUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${selectedSymbol}`;
    window.open(tvUrl, '_blank');
  };

  // Calcular estatísticas dos níveis de grid
  const gridStats = {
    total: gridLevels.length,
    active: gridLevels.filter(level => level.status === 'ACTIVE').length,
    pending: gridLevels.filter(level => level.status === 'PENDING').length,
    filled: gridLevels.filter(level => level.status === 'FILLED').length,
    buyLevels: gridLevels.filter(level => level.side === 'BUY').length,
    sellLevels: gridLevels.filter(level => level.side === 'SELL').length,
    minPrice: gridLevels.length > 0 ? Math.min(...gridLevels.map(l => l.price)) : 0,
    maxPrice: gridLevels.length > 0 ? Math.max(...gridLevels.map(l => l.price)) : 0
  };

  // Gerar parâmetros para o TradingView com níveis de grid
  const generateTradingViewUrl = () => {
    let baseUrl = `https://www.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:${selectedSymbol}&interval=15&hidesidetoolbar=1&hidetabs=1&saveimage=0&toolbarbg=f1f3f6&theme=light&timezone=America/Sao_Paulo&style=1&locale=pt_BR&gridlines=1&hidepopups=1&allow_symbol_change=1&watchlist=%5B%22BINANCE%3ABTCUSDT%22%2C%22BINANCE%3AETHUSDT%22%2C%22BINANCE%3AADAUSDT%22%2C%22BINANCE%3ABNBUSDT%22%5D`;
    
    // Se mostrar níveis de grid estiver ativado, adicionar linhas horizontais
    if (showGridLevels && gridLevels.length > 0) {
      const studies = gridLevels.slice(0, 20).map((level, index) => {
        const color = level.side === 'BUY' ? '00C851' : 'FF4444';
        const style = level.status === 'ACTIVE' ? '0' : '2'; // 0 = sólida, 2 = tracejada
        return `studies_overrides.%23${index}_plot.0.color=${color}&studies_overrides.%23${index}_plot.0.linestyle=${style}`;
      }).join('&');
      
      if (studies) {
        baseUrl += '&' + studies;
      }
    }
    
    return baseUrl;
  };

  return (
    <div className="space-y-6">
      {/* Controles do Gráfico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              TradingView - {selectedSymbol}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openTradingView}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir no TradingView
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChartHeight(chartHeight === 600 ? 800 : 600)}
              >
                {chartHeight === 600 ? 'Expandir' : 'Reduzir'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Switch 
                id="grid-levels" 
                checked={showGridLevels}
                onCheckedChange={setShowGridLevels}
              />
              <Label htmlFor="grid-levels" className="flex items-center gap-1">
                <Grid3X3 className="h-4 w-4" />
                Mostrar Níveis de Grid
              </Label>
            </div>
            
            {gridLevels.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span>Total:</span>
                    <Badge variant="outline">{gridStats.total}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Ativos:</span>
                    <Badge variant="default">{gridStats.active}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Pendentes:</span>
                    <Badge variant="secondary">{gridStats.pending}</Badge>
                  </div>
                </div>
              </>
            )}

            {marketData && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4" />
                  <span className="font-mono font-bold">
                    ${marketData.lastPrice >= 1 ? marketData.lastPrice.toFixed(2) : marketData.lastPrice.toFixed(6)}
                  </span>
                  <Badge variant={marketData.priceChangePercent >= 0 ? 'default' : 'destructive'}>
                    {marketData.priceChangePercent >= 0 ? '+' : ''}{marketData.priceChangePercent.toFixed(2)}%
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid Levels Info */}
      {showGridLevels && gridLevels.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Grid3X3 className="h-4 w-4" />
              Informações dos Níveis de Grid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{gridStats.buyLevels}</div>
                <div className="text-xs text-muted-foreground">Níveis de Compra</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{gridStats.sellLevels}</div>
                <div className="text-xs text-muted-foreground">Níveis de Venda</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{gridStats.active}</div>
                <div className="text-xs text-muted-foreground">Ordens Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{gridStats.filled}</div>
                <div className="text-xs text-muted-foreground">Executadas</div>
              </div>
            </div>
            
            {gridStats.minPrice > 0 && gridStats.maxPrice > 0 && (
              <div className="flex justify-between items-center text-sm bg-muted/30 p-3 rounded">
                <div>
                  <span className="text-muted-foreground">Range:</span>
                  <span className="font-mono ml-2">
                    ${gridStats.minPrice.toFixed(2)} - ${gridStats.maxPrice.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Spread:</span>
                  <span className="font-mono ml-2">
                    ${(gridStats.maxPrice - gridStats.minPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TradingView Chart */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: `${chartHeight}px` }} className="w-full">
            <iframe
              key={`${selectedSymbol}-${showGridLevels}`}
              src={generateTradingViewUrl()}
              className="w-full h-full border rounded-lg"
              title="TradingView Chart"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid Levels Table (se houver níveis) */}
      {showGridLevels && gridLevels.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Níveis de Grid Detalhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-right p-2">Preço</th>
                    <th className="text-right p-2">Quantidade</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-right p-2">Distância %</th>
                  </tr>
                </thead>
                <tbody>
                  {gridLevels.slice(0, 10).map((level, index) => {
                    const currentPrice = marketData?.lastPrice || 0;
                    const distancePercent = currentPrice > 0 ? 
                      ((level.price - currentPrice) / currentPrice * 100) : 0;
                    
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <Badge variant={level.side === 'BUY' ? 'default' : 'secondary'}>
                            {level.side}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-mono">${level.price.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono">{level.quantity?.toFixed(6) || '--'}</td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={
                              level.status === 'ACTIVE' ? 'default' : 
                              level.status === 'FILLED' ? 'outline' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {level.status}
                          </Badge>
                        </td>
                        <td className={`p-2 text-right font-mono ${
                          distancePercent > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {distancePercent > 0 ? '+' : ''}{distancePercent.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {gridLevels.length > 10 && (
                <div className="text-center text-xs text-muted-foreground mt-2">
                  Mostrando 10 de {gridLevels.length} níveis
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChartTab;
