
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Position } from "../types/trading";

interface ActivePositionsProps {
  positions: Position[];
}

const ActivePositions = ({ positions }: ActivePositionsProps) => {
  if (positions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h3 className="text-lg font-medium">No Active Positions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Positions will appear here once the grid trading bot opens them
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Current active trading positions</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Entry Price</TableHead>
          <TableHead>Mark Price</TableHead>
          <TableHead className="text-right">PnL</TableHead>
          <TableHead>Leverage</TableHead>
          <TableHead className="text-right">Size</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => (
          <TableRow key={position.symbol + position.side}>
            <TableCell className="font-medium">{position.symbol}</TableCell>
            <TableCell className={position.side === 'LONG' ? 'text-profit' : 'text-loss'}>
              {position.side}
            </TableCell>
            <TableCell>${position.entryPrice.toFixed(2)}</TableCell>
            <TableCell>${position.markPrice.toFixed(2)}</TableCell>
            <TableCell className={`text-right ${position.unrealizedPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {position.unrealizedPnl >= 0 ? '+'  : ''}{position.unrealizedPnl.toFixed(2)}
            </TableCell>
            <TableCell>{position.leverage}x</TableCell>
            <TableCell className="text-right">{position.quantity}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ActivePositions;
