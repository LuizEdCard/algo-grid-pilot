
import { Button } from "@/components/ui/button";
import { TradingMode } from "../types/trading";

interface TradingModeSelectorProps {
  currentMode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
  isTrading: boolean;
}

const TradingModeSelector = ({ 
  currentMode, 
  onModeChange, 
  isTrading 
}: TradingModeSelectorProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={currentMode === 'shadow' ? "default" : "outline"}
        size="sm"
        onClick={() => !isTrading && onModeChange('shadow')}
        disabled={isTrading || currentMode === 'shadow'}
        className="flex items-center"
      >
        <span className="w-2 h-2 bg-neutral mr-2 rounded-full animate-pulse-gentle"></span>
        Shadow Mode
      </Button>
      
      <Button
        variant={currentMode === 'production' ? "default" : "outline"}
        size="sm"
        onClick={() => !isTrading && onModeChange('production')}
        disabled={isTrading || currentMode === 'production'}
        className="flex items-center"
      >
        <span className="w-2 h-2 bg-loss mr-2 rounded-full"></span>
        Live Trading
      </Button>
      
      {isTrading && (
        <span className="text-xs text-muted-foreground">
          Cannot change mode while trading is active
        </span>
      )}
    </div>
  );
};

export default TradingModeSelector;
