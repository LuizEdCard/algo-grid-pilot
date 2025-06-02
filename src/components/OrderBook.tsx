
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
    // Só buscar dados reais se currentPrice for válido
    if (currentPrice > 0) {
      fetchRealOrderBook();
      
      const interval = setInterval(() => {
        fetchRealOrderBook();
      }, 5000); // Atualizar a cada 5 segundos
      
      return () => clearInterval(interval);
    }
  }, [symbol, currentPrice]);

  const fetchRealOrderBook = async () => {
    // Verificar se temos currentPrice válido
    if (!currentPrice || currentPrice <= 0) {
      console.warn('OrderBook: currentPrice is invalid:', currentPrice);
      return;
    }

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseURL}/orderbook/${symbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.bids && data.asks) {
          // Processar dados reais do backend
          const bids: OrderBookEntry[] = data.bids.map((bid: any, index: number) => ({
            price: parseFloat(bid[0]),
            quantity: parseFloat(bid[1]),
            total: data.bids.slice(0, index + 1).reduce((sum: number, b: any) => sum + parseFloat(b[1]), 0)
          }));
          
          const asks: OrderBookEntry[] = data.asks.map((ask: any, index: number) => ({
            price: parseFloat(ask[0]),
            quantity: parseFloat(ask[1]),
            total: data.asks.slice(0, index + 1).reduce((sum: number, a: any) => sum + parseFloat(a[1]), 0)
          }));

          const bestBid = bids[0]?.price || 0;
          const bestAsk = asks[0]?.price || 0;
          const calculatedSpread = bestAsk - bestBid;
          
          setOrderBook({
            bids: bids.reverse(), // Mostrar do maior para menor
            asks,
            lastUpdate: Date.now()
          });
          
          setSpread(calculatedSpread);
          console.log(`✅ Order book real carregado para ${symbol}`);
          return;
        }
      }
      
      // Se chegou aqui, não há dados reais disponíveis
      console.warn(`⚠️ Order book não disponível para ${symbol} - endpoint não implementado`);
      setOrderBook(null);
      
    } catch (error) {
      console.error(`❌ Erro ao buscar order book para ${symbol}:`, error);
      setOrderBook(null);
    }
  };

  if (!orderBook) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            Livro de Ordens - {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <div className="text-2xl">📋</div>
            <p className="text-sm text-muted-foreground">
              Order Book não disponível
            </p>
            <p className="text-xs text-muted-foreground">
              Endpoint do backend não implementado
            </p>
            <p className="text-xs text-green-600">
              ✅ Dados mock removidos para precisão
            </p>
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
