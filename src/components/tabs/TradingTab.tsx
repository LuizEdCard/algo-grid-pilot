
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Settings } from 'lucide-react';
import ImprovedGridConfig from '../ImprovedGridConfig';
import BalanceDisplay from '../BalanceDisplay';
import { MarketData } from '../../types/trading';

interface TradingTabProps {
  selectedSymbol: string;
  marketData?: MarketData;
  isTrading: boolean;
  onStartTrading: (symbol: string, config?: any) => Promise<void>;
  onSymbolChange: (symbol: string) => void;
}

const TradingTab: React.FC<TradingTabProps> = ({
  selectedSymbol,
  marketData,
  isTrading,
  onStartTrading,
  onSymbolChange
}) => {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Grid Configuration */}
      <div className="col-span-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Configuração de Grid Trading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImprovedGridConfig
              symbol={selectedSymbol}
              currentPrice={marketData?.lastPrice}
              onStart={(config) => onStartTrading(selectedSymbol, config)}
              isActive={isTrading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Balance and Quick Stats */}
      <div className="col-span-4 space-y-6">
        <BalanceDisplay />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Par Ativo:</span>
              <span className="font-medium">{selectedSymbol}</span>
            </div>
            
            {marketData && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Preço Atual:</span>
                <span className="font-medium">${marketData.lastPrice.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className={`font-medium ${isTrading ? 'text-green-600' : 'text-gray-600'}`}>
                {isTrading ? 'Ativo' : 'Parado'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradingTab;
