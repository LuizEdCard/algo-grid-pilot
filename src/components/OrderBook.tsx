
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import { OrderBook as OrderBookType, OrderBookEntry } from '../types/chart';

interface OrderBookProps {
  symbol: string;
  currentPrice: number;
}

const OrderBook = ({ symbol, currentPrice }: OrderBookProps) => {
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [spread, setSpread] = useState<number>(0);

  useEffect(() => {
    // Simular dados do livro de ordens
    generateMockOrderBook();
    
    const interval = setInterval(() => {
      generateMockOrderBook();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [symbol, currentPrice]);

  const generateMockOrderBook = () => {
    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];
    
    // Gerar bids (ordens de compra) - preços abaixo do atual
    for (let i = 0; i < 15; i++) {
      const price = currentPrice * (1 - (i + 1) * 0.001);
      const quantity = Math.random() * 10 + 0.1;
      const total = bids.reduce((sum, bid) => sum + bid.quantity, 0) + quantity;
      
      bids.push({ price, quantity, total });
    }
    
    // Gerar asks (ordens de venda) - preços acima do atual
    for (let i = 0; i < 15; i++) {
      const price = currentPrice * (1 + (i + 1) * 0.001);
      const quantity = Math.random() * 10 + 0.1;
      const total = asks.reduce((sum, ask) => sum + ask.quantity, 0) + quantity;
      
      asks.push({ price, quantity, total });
    }
    
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const calculatedSpread = bestAsk - bestBid;
    
    setOrderBook({
      bids: bids.reverse(), // Mostrar do maior para menor
      asks,
      lastUpdate: Date.now()
    });
    
    setSpread(calculatedSpread);
  };

  if (!orderBook) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            Livro de Ordens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxBidQuantity = Math.max(...orderBook.bids.map(b => b.quantity));
  const maxAskQuantity = Math.max(...orderBook.asks.map(a => a.quantity));

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4" />
          Livro de Ordens - {symbol}
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Spread: ${spread.toFixed(2)}</span>
          <span>({((spread / currentPrice) * 100).toFixed(3)}%)</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Cabeçalho */}
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground mb-2">
          <span className="text-right">Preço</span>
          <span className="text-right">Quantidade</span>
          <span className="text-right">Total</span>
        </div>
        
        {/* Asks (Vendas) */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {orderBook.asks.slice(0, 8).reverse().map((ask, index) => (
            <div key={`ask-${index}`} className="relative">
              {/* Barra de profundidade */}
              <div 
                className="absolute inset-y-0 right-0 bg-red-500/10 rounded"
                style={{ width: `${(ask.quantity / maxAskQuantity) * 100}%` }}
              />
              <div className="grid grid-cols-3 gap-2 text-xs relative z-10 py-1">
                <span className="text-right text-red-500 font-mono">
                  {ask.price.toFixed(2)}
                </span>
                <span className="text-right font-mono">
                  {ask.quantity.toFixed(3)}
                </span>
                <span className="text-right font-mono text-muted-foreground">
                  {ask.total.toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Preço atual */}
        <div className="flex items-center justify-center py-2">
          <Badge variant="outline" className="font-mono">
            ${currentPrice.toFixed(2)}
          </Badge>
        </div>
        
        {/* Bids (Compras) */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {orderBook.bids.slice(0, 8).map((bid, index) => (
            <div key={`bid-${index}`} className="relative">
              {/* Barra de profundidade */}
              <div 
                className="absolute inset-y-0 right-0 bg-green-500/10 rounded"
                style={{ width: `${(bid.quantity / maxBidQuantity) * 100}%` }}
              />
              <div className="grid grid-cols-3 gap-2 text-xs relative z-10 py-1">
                <span className="text-right text-green-500 font-mono">
                  {bid.price.toFixed(2)}
                </span>
                <span className="text-right font-mono">
                  {bid.quantity.toFixed(3)}
                </span>
                <span className="text-right font-mono text-muted-foreground">
                  {bid.total.toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs">Bids: {orderBook.bids.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span className="text-xs">Asks: {orderBook.asks.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBook;
