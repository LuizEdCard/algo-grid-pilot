
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProfessionalChart from '../ProfessionalChart';
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
  const openTradingView = () => {
    const tvUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${selectedSymbol}`;
    window.open(tvUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* TradingView Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              TradingView - {selectedSymbol}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openTradingView}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir no TradingView
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <iframe
              src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:${selectedSymbol}&interval=15&hidesidetoolbar=1&hidetabs=1&saveimage=0&toolbarbg=f1f3f6&theme=light&timezone=America/Sao_Paulo&style=1&locale=pt_BR&gridlines=1&hidepopups=1&allow_symbol_change=1&watchlist=%5B%22BINANCE%3ABTCUSDT%22%2C%22BINANCE%3AETHUSDT%22%2C%22BINANCE%3AADAUSDT%22%2C%22BINANCE%3ABNBUSDT%22%5D`}
              className="w-full h-full border rounded-lg"
              title="TradingView Chart"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Chart with Grid Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gráfico Avançado com Níveis de Grid
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ProfessionalChart
            symbol={selectedSymbol}
            gridLevels={gridLevels}
            marketData={marketData}
            onSymbolChange={onSymbolChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartTab;
