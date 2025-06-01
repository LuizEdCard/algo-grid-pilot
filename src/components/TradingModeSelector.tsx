
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
        variant="default"
        size="sm"
        disabled={true}
        className="flex items-center"
      >
        <span className="w-2 h-2 bg-green-500 mr-2 rounded-full"></span>
        Live Trading Mode
      </Button>
      
      {isTrading && (
        <span className="text-xs text-muted-foreground">
          Trading is active
        </span>
      )}
    </div>
  );
};

export default TradingModeSelector;
