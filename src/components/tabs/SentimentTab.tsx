
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, TrendingUp, TrendingDown, MessageCircle, 
  Users, Search, Clock, Heart
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface SentimentData {
  symbol: string;
  sentiment_score: number;
  confidence: number;
  trend: string;
  sources_analyzed: number;
  last_update: string;
}

interface SocialPost {
  platform: string;
  content: string;
  sentiment: number;
  engagement: number;
  timestamp: string;
  author: string;
}

interface InfluencerPost {
  influencer: string;
  platform: string;
  content: string;
  sentiment: number;
  followers: number;
  timestamp: string;
}

const SentimentTab = () => {
  const [sentimentStatus, setSentimentStatus] = useState<any>(null);
  const [symbolSentiment, setSymbolSentiment] = useState<SentimentData | null>(null);
  const [socialFeeds, setSocialFeeds] = useState<SocialPost[]>([]);
  const [influencerPosts, setInfluencerPosts] = useState<InfluencerPost[]>([]);
  const [searchSymbol, setSearchSymbol] = useState('BTCUSDT');
  const [customText, setCustomText] = useState('');
  const [customAnalysis, setCustomAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch sentiment status
  const fetchSentimentStatus = async () => {
    try {
      const response = await fetch('/api/sentiment/status');
      if (response.ok) {
        const data = await response.json();
        setSentimentStatus(data);
      }
    } catch (error) {
      console.error('Erro ao buscar status do sentiment:', error);
    }
  };

  // Fetch symbol sentiment
  const fetchSymbolSentiment = async (symbol: string) => {
    try {
      const response = await fetch(`/api/social/sentiment/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setSymbolSentiment(data);
      }
    } catch (error) {
      console.error('Erro ao buscar sentiment do símbolo:', error);
    }
  };

  // Fetch social feeds
  const fetchSocialFeeds = async () => {
    try {
      const response = await fetch('/api/social/feeds');
      if (response.ok) {
        const data = await response.json();
        setSocialFeeds(data.posts || []);
      }
    } catch (error) {
      console.error('Erro ao buscar feeds sociais:', error);
    }
  };

  // Fetch influencer posts
  const fetchInfluencerPosts = async () => {
    try {
      const response = await fetch('/api/social/influencers');
      if (response.ok) {
        const data = await response.json();
        setInfluencerPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Erro ao buscar posts de influenciadores:', error);
    }
  };

  // Analyze custom text
  const analyzeCustomText = async () => {
    if (!customText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customText })
      });

      if (response.ok) {
        const data = await response.json();
        setCustomAnalysis(data);
        toast({
          title: "Análise concluída",
          description: `Sentiment: ${getSentimentLabel(data.sentiment)}`
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha na análise de sentiment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.1) return 'Positivo';
    if (score < -0.1) return 'Negativo';
    return 'Neutro';
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'text-green-600';
    if (score < -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score < -0.1) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <MessageCircle className="h-4 w-4 text-gray-600" />;
  };

  useEffect(() => {
    fetchSentimentStatus();
    fetchSocialFeeds();
    fetchInfluencerPosts();
    
    const interval = setInterval(() => {
      fetchSentimentStatus();
      fetchSocialFeeds();
      fetchInfluencerPosts();
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchSymbol) {
      fetchSymbolSentiment(searchSymbol);
    }
  }, [searchSymbol]);

  return (
    <div className="space-y-6">
      {/* Sentiment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Status da Análise de Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sentimentStatus?.models_loaded || 0}
              </div>
              <div className="text-sm text-muted-foreground">Modelos Carregados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sentimentStatus?.daily_analyses || 0}
              </div>
              <div className="text-sm text-muted-foreground">Análises Hoje</div>
            </div>
            <div className="text-center">
              <Badge variant={sentimentStatus?.status === 'active' ? 'default' : 'secondary'}>
                {sentimentStatus?.status || 'Carregando...'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Status Sistema</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symbol Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Análise de Sentiment por Símbolo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                placeholder="BTCUSDT"
                className="flex-1"
              />
              <Button onClick={() => fetchSymbolSentiment(searchSymbol)}>
                Analisar
              </Button>
            </div>

            {symbolSentiment && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSentimentColor(symbolSentiment.sentiment_score)}`}>
                    {getSentimentLabel(symbolSentiment.sentiment_score)}
                  </div>
                  <div className="text-sm text-muted-foreground">Sentiment Geral</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {(symbolSentiment.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confiança</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {symbolSentiment.sources_analyzed}
                  </div>
                  <div className="text-sm text-muted-foreground">Fontes Analisadas</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline">
                    {symbolSentiment.trend}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Tendência</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Text Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Análise de Texto Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-text">Texto para Análise</Label>
              <Textarea
                id="custom-text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Digite um texto para análise de sentiment..."
                className="min-h-24"
              />
            </div>
            <Button onClick={analyzeCustomText} disabled={loading || !customText.trim()}>
              {loading ? 'Analisando...' : 'Analisar Sentiment'}
            </Button>

            {customAnalysis && (
              <div className="p-4 border rounded bg-muted/50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-xl font-bold ${getSentimentColor(customAnalysis.sentiment)}`}>
                      {getSentimentLabel(customAnalysis.sentiment)}
                    </div>
                    <div className="text-sm text-muted-foreground">Resultado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {(customAnalysis.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confiança</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {customAnalysis.score?.toFixed(3) || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Media Feeds */}
      <Tabs defaultValue="social" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="social">Feed Social</TabsTrigger>
          <TabsTrigger value="influencers">Influenciadores</TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Posts Recentes de Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {socialFeeds.map((post, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{post.platform}</Badge>
                          <span className="text-sm font-medium">@{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(post.sentiment)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm mb-2">{post.content}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Engagement: {post.engagement}</span>
                        <span className={getSentimentColor(post.sentiment)}>
                          Sentiment: {getSentimentLabel(post.sentiment)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="influencers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Posts de Influenciadores Cripto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {influencerPosts.map((post, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{post.platform}</Badge>
                          <span className="text-sm font-medium">{post.influencer}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {(post.followers / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(post.sentiment)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm mb-2">{post.content}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className={getSentimentColor(post.sentiment)}>
                          Sentiment: {getSentimentLabel(post.sentiment)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SentimentTab;
