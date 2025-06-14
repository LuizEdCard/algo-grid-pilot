
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Activity } from 'lucide-react';
import RecommendedPairs from '../RecommendedPairs';
import TradingStats from '../TradingStats';
import ManualPairSelector from '../ManualPairSelector';
import { MarketData } from '../../types/trading';

interface MarketTabProps {
  availablePairs: MarketData[];
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  lastUpdate: Date;
}

const MarketTab: React.FC<MarketTabProps> = ({
  availablePairs,
  selectedSymbol,
  onSymbolChange,
  lastUpdate
}) => {
  const handlePairAdded = (symbol: string) => {
    onSymbolChange(symbol);
  };

  return (
    <div className="space-y-6">
      {/* Top Section - Controls and Stats */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <RecommendedPairs
            onSelectPair={onSymbolChange}
            currentSymbol={selectedSymbol}
          />
        </div>
        
        <div className="col-span-4">
          <ManualPairSelector onPairAdded={handlePairAdded} />
        </div>
        
        <div className="col-span-4">
          <TradingStats symbol={selectedSymbol} />
        </div>
      </div>

      {/* Market Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Dados de Mercado em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Símbolo</th>
                  <th className="text-right p-2">Preço</th>
                  <th className="text-right p-2">Variação 24h</th>
                  <th className="text-right p-2">Volume</th>
                  <th className="text-right p-2">Alta 24h</th>
                  <th className="text-right p-2">Baixa 24h</th>
                </tr>
              </thead>
              <tbody>
                {availablePairs.slice(0, 20).map((pair) => (
                  <tr 
                    key={pair.symbol} 
                    className={`border-b hover:bg-muted/50 cursor-pointer ${
                      pair.symbol === selectedSymbol ? 'bg-blue-50 dark:bg-blue-950' : ''
                    }`}
                    onClick={() => onSymbolChange(pair.symbol)}
                  >
                    <td className="p-2 font-medium">{pair.symbol}</td>
                    <td className="p-2 text-right">
                      ${pair.lastPrice ? pair.lastPrice.toFixed(2) : '0.00'}
                    </td>
                    <td className={`p-2 text-right ${(pair.priceChangePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(pair.priceChangePercent || 0) >= 0 ? '+' : ''}{(pair.priceChangePercent || 0).toFixed(2)}%
                    </td>
                    <td className="p-2 text-right">
                      {pair.volume24h ? (pair.volume24h / 1000000).toFixed(2) : '0.00'}M
                    </td>
                    <td className="p-2 text-right text-green-600">
                      ${pair.high24h ? pair.high24h.toFixed(2) : '0.00'}
                    </td>
                    <td className="p-2 text-right text-red-600">
                      ${pair.low24h ? pair.low24h.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Tempo real
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketTab;
