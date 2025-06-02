
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RealBinanceService, RecommendedPair } from '../services/realBinanceService';
import { toast } from "@/hooks/use-toast";
import { Star, RefreshCw, TrendingUp } from 'lucide-react';

interface RecommendedPairsProps {
  onSelectPair: (symbol: string) => void;
  currentSymbol: string;
}

const RecommendedPairs = ({ onSelectPair, currentSymbol }: RecommendedPairsProps) => {
  const [recommendedPairs, setRecommendedPairs] = useState<RecommendedPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRecommendedPairs = async () => {
    setIsLoading(true);
    try {
      const pairs = await RealBinanceService.getRecommendedPairs();
      setRecommendedPairs(pairs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch recommended pairs:', error);
      toast({
        title: "Erro ao buscar pares recomendados",
        description: "Não foi possível obter pares recomendados. Verifique a conexão com o backend.",
        variant: "destructive"
      });
      // Fallback com pares populares
      setRecommendedPairs([
        { symbol: 'BTCUSDT', score: 0.95 },
        { symbol: 'ETHUSDT', score: 0.90 },
        { symbol: 'BNBUSDT', score: 0.85 },
        { symbol: 'ADAUSDT', score: 0.80 },
        { symbol: 'DOTUSDT', score: 0.75 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendedPairs();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRecommendedPairs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPair = (symbol: string) => {
    onSelectPair(symbol);
    toast({
      title: "Par selecionado",
      description: `Mudou para ${symbol}`
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-500';
    if (score >= 0.8) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.9) return 'default';
    if (score >= 0.8) return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5" />
            Pares Recomendados
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRecommendedPairs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Última atualização: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {recommendedPairs.length > 0 ? (
          <>
            {recommendedPairs.map((pair, index) => (
              <div 
                key={pair.symbol} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  currentSymbol === pair.symbol 
                    ? 'bg-primary/10 border-primary' 
                    : 'hover:bg-muted/50 cursor-pointer'
                }`}
                onClick={() => currentSymbol !== pair.symbol && handleSelectPair(pair.symbol)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{pair.symbol}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Score de IA
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant={getScoreBadgeVariant(pair.score)}>
                    <span className={getScoreColor(pair.score)}>
                      {(pair.score * 100).toFixed(0)}%
                    </span>
                  </Badge>
                  {currentSymbol === pair.symbol && (
                    <div className="text-xs text-primary mt-1">Ativo</div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Recomendações baseadas em análise de volatilidade, volume e padrões técnicos
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum par recomendado</p>
            <p className="text-xs">Aguarde a análise do sistema</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendedPairs;
