
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarketData } from '../types/trading';

interface SymbolSelectorProps {
  marketData: MarketData[];
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const SymbolSelector = ({ marketData, selectedSymbol, onSymbolChange }: SymbolSelectorProps) => {
  const [sortedData, setSortedData] = useState<MarketData[]>([]);
  
  useEffect(() => {
    // Sort symbols by volume
    const sorted = [...marketData].sort((a, b) => b.volume24h - a.volume24h);
    setSortedData(sorted);
  }, [marketData]);
  
  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <Select value={selectedSymbol} onValueChange={onSymbolChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a trading pair" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Recommended Pairs</SelectLabel>
            {sortedData.map((item) => (
              <SelectItem key={item.symbol} value={item.symbol}>
                <div className="flex justify-between w-full">
                  <span>{item.symbol}</span>
                  <span className="ml-4 text-xs text-muted-foreground">
                    {formatVolume(item.volume24h)} 
                    <span className={item.priceChangePercent >= 0 ? "text-profit" : "text-loss"}>
                      {item.priceChangePercent >= 0 ? ' +' : ' '}
                      {item.priceChangePercent.toFixed(2)}%
                    </span>
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {selectedSymbol && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>24h Volume: {formatVolume(marketData.find(m => m.symbol === selectedSymbol)?.volume24h || 0)}</span>
          <span className={marketData.find(m => m.symbol === selectedSymbol)?.priceChangePercent >= 0 ? "text-profit" : "text-loss"}>
            24h Change: {marketData.find(m => m.symbol === selectedSymbol)?.priceChangePercent.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default SymbolSelector;
