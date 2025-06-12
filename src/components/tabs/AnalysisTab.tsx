
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Brain, MessageSquare, BarChart3 } from 'lucide-react';
import { MarketData } from '../../types/trading';
import axios from 'axios';

interface AnalysisTabProps {
  selectedSymbol: string;
  marketData?: MarketData;
}

interface TechnicalIndicators {
  rsi: number;
  macd: number;
  sma20: number;
  sma50: number;
  bollingerUpper: number;
  bollingerLower: number;
}

interface SentimentData {
  overall: number;
  reddit: number;
  news: number;
  confidence: number;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({
  selectedSymbol,
  marketData
}) => {
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalysisData();
  }, [selectedSymbol]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    try {
      // Fetch technical indicators
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      // Simulated data for now - replace with real API calls
      setIndicators({
        rsi: 65.4,
        macd: 0.15,
        sma20: marketData?.lastPrice ? marketData.lastPrice * 0.98 : 44000,
        sma50: marketData?.lastPrice ? marketData.lastPrice * 0.96 : 43200,
        bollingerUpper: marketData?.lastPrice ? marketData.lastPrice * 1.02 : 45900,
        bollingerLower: marketData?.lastPrice ? marketData.lastPrice * 0.98 : 44100
      });

      setSentiment({
        overall: 0.65,
        reddit: 0.72,
        news: 0.58,
        confidence: 0.84
      });

      setAiAnalysis(`Análise para ${selectedSymbol}: O par está mostrando sinais mistos. O RSI indica condição de sobrecompra, mas o MACD sugere momentum positivo. O sentimento geral está positivo com alta confiança.`);

    } catch (error) {
      console.error('Error fetching analysis data:', error);
    }
    setLoading(false);
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { status: 'Sobrecompra', color: 'destructive' };
    if (rsi < 30) return { status: 'Sobrevenda', color: 'destructive' };
    return { status: 'Normal', color: 'default' };
  };

  const getSentimentStatus = (value: number) => {
    if (value > 0.6) return { status: 'Positivo', color: 'default' };
    if (value < 0.4) return { status: 'Negativo', color: 'destructive' };
    return { status: 'Neutro', color: 'secondary' };
  };

  return (
    <div className="space-y-6">
      {/* Technical Analysis */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise Técnica - {selectedSymbol}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-center py-8">Carregando indicadores...</div>
              ) : indicators ? (
                <div className="grid grid-cols-2 gap-6">
                  {/* RSI */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">RSI (14)</span>
                      <Badge variant={getRSIStatus(indicators.rsi).color as any}>
                        {getRSIStatus(indicators.rsi).status}
                      </Badge>
                    </div>
                    <Progress value={indicators.rsi} className="h-2" />
                    <span className="text-xs text-muted-foreground">{indicators.rsi.toFixed(1)}</span>
                  </div>

                  {/* MACD */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">MACD</span>
                      <Badge variant={indicators.macd > 0 ? 'default' : 'destructive'}>
                        {indicators.macd > 0 ? 'Bullish' : 'Bearish'}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold">
                      {indicators.macd > 0 ? '+' : ''}{indicators.macd.toFixed(3)}
                    </div>
                  </div>

                  {/* Moving Averages */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Médias Móveis</span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs">SMA 20:</span>
                        <span className="text-xs font-mono">${indicators.sma20.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs">SMA 50:</span>
                        <span className="text-xs font-mono">${indicators.sma50.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bollinger Bands */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Bollinger Bands</span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs">Superior:</span>
                        <span className="text-xs font-mono">${indicators.bollingerUpper.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs">Inferior:</span>
                        <span className="text-xs font-mono">${indicators.bollingerLower.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">Erro ao carregar indicadores</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sentiment Analysis */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Análise de Sentimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sentiment && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Geral</span>
                      <Badge variant={getSentimentStatus(sentiment.overall).color as any}>
                        {getSentimentStatus(sentiment.overall).status}
                      </Badge>
                    </div>
                    <Progress value={sentiment.overall * 100} className="h-2" />
                    <span className="text-xs text-muted-foreground">{(sentiment.overall * 100).toFixed(1)}%</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm">Reddit</span>
                    <Progress value={sentiment.reddit * 100} className="h-2" />
                    <span className="text-xs text-muted-foreground">{(sentiment.reddit * 100).toFixed(1)}%</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm">Notícias</span>
                    <Progress value={sentiment.news * 100} className="h-2" />
                    <span className="text-xs text-muted-foreground">{(sentiment.news * 100).toFixed(1)}%</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm">Confiança</span>
                    <Progress value={sentiment.confidence * 100} className="h-2" />
                    <span className="text-xs text-muted-foreground">{(sentiment.confidence * 100).toFixed(1)}%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análise de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm leading-relaxed">
              {aiAnalysis || 'Carregando análise de IA...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisTab;
