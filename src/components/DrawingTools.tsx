
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Crosshair, TrendingUp, Minus, Activity, 
  Square, RotateCcw, Trash2 
} from 'lucide-react';
import { DrawingTool } from '../types/chart';

interface DrawingToolsProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  onClearDrawings: () => void;
  drawingTools: DrawingTool[];
}

const DrawingTools = ({ 
  selectedTool, 
  onToolSelect, 
  onClearDrawings, 
  drawingTools 
}: DrawingToolsProps) => {
  const tools = [
    { id: 'none', name: 'Seleção', icon: Crosshair },
    { id: 'trendline', name: 'Linha de Tendência', icon: TrendingUp },
    { id: 'horizontal', name: 'Linha Horizontal', icon: Minus },
    { id: 'fibonacci', name: 'Fibonacci', icon: Activity },
    { id: 'rectangle', name: 'Retângulo', icon: Square }
  ];

  const fibonacciLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Ferramentas de Desenho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ferramentas principais */}
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onToolSelect(tool.id)}
                className="flex flex-col items-center gap-1 h-16"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{tool.name}</span>
              </Button>
            );
          })}
        </div>

        <Separator />

        {/* Níveis de Fibonacci */}
        {selectedTool === 'fibonacci' && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium">Níveis de Fibonacci</h4>
            <div className="grid grid-cols-4 gap-1">
              {fibonacciLevels.map((level) => (
                <Badge key={level} variant="outline" className="text-xs justify-center">
                  {(level * 100).toFixed(1)}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearDrawings}
            disabled={drawingTools.length === 0}
            className="flex-1"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Limpar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToolSelect('none')}
            className="flex-1"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Lista de desenhos ativos */}
        {drawingTools.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-medium">Desenhos Ativos ({drawingTools.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {drawingTools.map((drawing) => (
                  <div key={drawing.id} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{drawing.type.replace('_', ' ')}</span>
                    <Badge variant="outline" className="text-xs">
                      {drawing.style}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DrawingTools;
