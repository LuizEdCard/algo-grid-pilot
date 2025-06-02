
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RealBinanceService } from '../services/realBinanceService';
import { toast } from "@/hooks/use-toast";
import { Plus, Search, AlertCircle } from 'lucide-react';

interface ManualPairSelectorProps {
  onPairAdded: (symbol: string) => void;
}

const ManualPairSelector = ({ onPairAdded }: ManualPairSelectorProps) => {
  const [symbol, setSymbol] = useState('');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);

  const validateAndAddPair = async () => {
    if (!symbol.trim()) {
      toast({
        title: "Símbolo obrigatório",
        description: "Digite um símbolo de trading válido (ex: BTCUSDT)",
        variant: "destructive"
      });
      return;
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    
    // Basic validation
    if (!/^[A-Z]{6,12}$/.test(cleanSymbol)) {
      toast({
        title: "Formato inválido",
        description: "O símbolo deve conter apenas letras maiúsculas (ex: BTCUSDT)",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const isValid = await RealBinanceService.validateCustomPair(cleanSymbol, marketType);
      
      if (isValid) {
        setValidationResult('valid');
        onPairAdded(cleanSymbol);
        toast({
          title: "Par adicionado com sucesso",
          description: `${cleanSymbol} foi adicionado à lista de trading`
        });
        setSymbol('');
      } else {
        setValidationResult('invalid');
        toast({
          title: "Par não encontrado",
          description: `${cleanSymbol} não foi encontrado no mercado ${marketType}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o par. Verifique a conexão com o backend.",
        variant: "destructive"
      });
      setValidationResult('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndAddPair();
    }
  };

  const handleSymbolChange = (value: string) => {
    setSymbol(value);
    setValidationResult(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Adicionar Par Customizado
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="symbol">Símbolo</Label>
            <div className="relative">
              <Input
                id="symbol"
                placeholder="BTCUSDT"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={isValidating}
                className={`pr-10 ${
                  validationResult === 'valid' 
                    ? 'border-green-500' 
                    : validationResult === 'invalid' 
                    ? 'border-red-500' 
                    : ''
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isValidating && (
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                )}
                {validationResult === 'valid' && (
                  <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full" />
                  </div>
                )}
                {validationResult === 'invalid' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="market-type">Tipo de Mercado</Label>
            <Select value={marketType} onValueChange={(value: 'spot' | 'futures') => setMarketType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="futures">Futures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={validateAndAddPair} 
          disabled={!symbol.trim() || isValidating}
          className="w-full"
        >
          <Search className="h-4 w-4 mr-2" />
          {isValidating ? 'Validando...' : 'Validar e Adicionar'}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Digite o símbolo exato (ex: BTCUSDT, ETHBTC)</p>
          <p>• O sistema verificará se o par existe na Binance</p>
          <p>• Apenas pares válidos serão adicionados à lista</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualPairSelector;
