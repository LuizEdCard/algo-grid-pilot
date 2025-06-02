
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RealBinanceService, IndicatorData } from '../services/realBinanceService';
import { toast } from "@/hooks/use-toast";
import { TrendingUp, X } from 'lucide-react';

interface TechnicalIndicatorsProps {
  symbol: string;
  onIndicatorDataUpdate: (indicators: IndicatorData[]) => void;
}

interface SelectedIndicator {
  type: string;
  period: number;
  data?: IndicatorData;
}

const TechnicalIndicators = ({ symbol, onIndicatorDataUpdate }: TechnicalIndicatorsProps) => {
  const [availableIndicators, setAvailableIndicators] = useState<string[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<SelectedIndicator[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [period, setPeriod] = useState<number>(14);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available indicators on mount
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const indicators = await RealBinanceService.getAvailableIndicators();
        setAvailableIndicators(indicators);
      } catch (error) {
        console.error('Failed to fetch indicators:', error);
        // Fallback indicators if API fails
        setAvailableIndicators(['SMA', 'EMA', 'RSI', 'MACD', 'ATR', 'ADX', 'BollingerBands', 'Stochastic', 'VWAP', 'OBV']);
      }
    };

    fetchIndicators();
  }, []);

  // Fetch indicator data when symbol changes
  useEffect(() => {
    if (selectedIndicators.length > 0) {
      fetchAllIndicatorData();
    }
  }, [symbol]);

  const fetchAllIndicatorData = async () => {
    if (!symbol) return;

    setIsLoading(true);
    const updatedIndicators: SelectedIndicator[] = [];

    for (const indicator of selectedIndicators) {
      try {
        const data = await RealBinanceService.getIndicatorData(symbol, indicator.type, indicator.period);
        updatedIndicators.push({ ...indicator, data });
      } catch (error) {
        console.error(`Failed to fetch ${indicator.type} data:`, error);
        updatedIndicators.push(indicator);
      }
    }

    setSelectedIndicators(updatedIndicators);
    const indicatorData = updatedIndicators.map(ind => ind.data).filter(Boolean) as IndicatorData[];
    onIndicatorDataUpdate(indicatorData);
    setIsLoading(false);
  };

  const addIndicator = async () => {
    if (!selectedType || selectedIndicators.length >= 10) return;

    // Check if indicator already exists
    const exists = selectedIndicators.some(ind => ind.type === selectedType && ind.period === period);
    if (exists) {
      toast({
        title: "Indicador já adicionado",
        description: `${selectedType} com período ${period} já está na lista`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const newIndicator: SelectedIndicator = { type: selectedType, period };

    try {
      if (symbol) {
        const data = await RealBinanceService.getIndicatorData(symbol, selectedType, period);
        newIndicator.data = data;
      }

      const updated = [...selectedIndicators, newIndicator];
      setSelectedIndicators(updated);
      
      const indicatorData = updated.map(ind => ind.data).filter(Boolean) as IndicatorData[];
      onIndicatorDataUpdate(indicatorData);

      toast({
        title: "Indicador adicionado",
        description: `${selectedType} (${period}) foi adicionado ao gráfico`
      });

      setSelectedType('');
      setPeriod(14);
    } catch (error) {
      console.error('Failed to add indicator:', error);
      toast({
        title: "Erro ao adicionar indicador",
        description: "Falha ao obter dados do indicador. Verifique a conexão com o backend.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeIndicator = (index: number) => {
    const updated = selectedIndicators.filter((_, i) => i !== index);
    setSelectedIndicators(updated);
    
    const indicatorData = updated.map(ind => ind.data).filter(Boolean) as IndicatorData[];
    onIndicatorDataUpdate(indicatorData);

    toast({
      title: "Indicador removido",
      description: "Indicador foi removido do gráfico"
    });
  };

  const refreshIndicators = () => {
    fetchAllIndicatorData();
    toast({
      title: "Atualizando indicadores",
      description: "Buscando dados mais recentes..."
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Indicadores Técnicos</h3>
      </div>

      {/* Add new indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
        <div>
          <Label htmlFor="indicator-type">Tipo</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar indicador" />
            </SelectTrigger>
            <SelectContent>
              {availableIndicators.map(indicator => (
                <SelectItem key={indicator} value={indicator}>
                  {indicator}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="period">Período</Label>
          <Input
            id="period"
            type="number"
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value) || 14)}
            min="1"
            max="200"
          />
        </div>

        <div className="flex items-end">
          <Button 
            onClick={addIndicator} 
            disabled={!selectedType || isLoading || selectedIndicators.length >= 10}
            className="w-full"
          >
            Adicionar
          </Button>
        </div>
      </div>

      {/* Selected indicators */}
      {selectedIndicators.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Indicadores Selecionados ({selectedIndicators.length}/10)
              </span>
              <Button variant="outline" size="sm" onClick={refreshIndicators} disabled={isLoading}>
                Atualizar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedIndicators.map((indicator, index) => (
                <Badge key={`${indicator.type}-${indicator.period}`} variant="secondary" className="flex items-center gap-1">
                  {indicator.type} ({indicator.period})
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeIndicator(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedIndicators.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum indicador selecionado</p>
          <p className="text-xs">Adicione até 10 indicadores técnicos ao gráfico</p>
        </div>
      )}
    </div>
  );
};

export default TechnicalIndicators;
