
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RLState } from "../types/trading";
import { rlService } from "../services/rlService";
import { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface RLModelStatusProps {
  rlState: RLState;
  onTrainModel: () => void;
}

const RLModelStatus = ({ rlState, onTrainModel }: RLModelStatusProps) => {
  const { currentModel, isTraining, lastTrainingTime, performance, confidence } = rlState;
  const [simulatedRewards, setSimulatedRewards] = useState<{ episode: number; reward: number }[]>([]);
  const [autonomousMode, setAutonomousMode] = useState(rlService.getAutonomousMode());
  const [autonomousStatus, setAutonomousStatus] = useState(rlService.getAutonomousStatus());
  
  // Generate simulated reward data for visualization
  useEffect(() => {
    const data = Array(20).fill(0).map((_, idx) => ({
      episode: idx + 1,
      reward: Math.sin(idx / 3) * 10 + 20 + performance * 10 + (Math.random() - 0.5) * 5
    }));
    setSimulatedRewards(data);
  }, [performance]);

  // Update autonomous status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAutonomousStatus(rlService.getAutonomousStatus());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAutonomousModeChange = (enabled: boolean) => {
    rlService.setAutonomousMode(enabled);
    setAutonomousMode(enabled);
    setAutonomousStatus(rlService.getAutonomousStatus());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Reinforcement Learning Status</span>
          <Button 
            size="sm" 
            onClick={onTrainModel}
            disabled={isTraining}
          >
            {isTraining ? 'Training...' : 'Train Model'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Model</p>
            <p className="text-lg font-medium">{currentModel}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Trained</p>
            <p className="text-lg font-medium">
              {new Date(lastTrainingTime).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Model Performance</span>
              <span className="text-sm font-medium">{Math.round(performance * 100)}%</span>
            </div>
            <Progress value={performance * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Prediction Confidence</span>
              <span className="text-sm font-medium">{Math.round(confidence * 100)}%</span>
            </div>
            <Progress value={confidence * 100} className="h-2" />
          </div>
        </div>
        
        {/* Autonomous Trading Mode */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Switch 
                id="autonomous-mode"
                checked={autonomousMode}
                onCheckedChange={handleAutonomousModeChange}
              />
              <Label htmlFor="autonomous-mode" className="text-sm font-medium">
                Modo Autônomo
              </Label>
            </div>
            <Badge variant={autonomousMode ? 'default' : 'secondary'}>
              {autonomousMode ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          
          {autonomousMode && (
            <div className="text-xs space-y-2 bg-muted p-3 rounded">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Bots Ativos:</span>
                  <span className="ml-1 font-medium">{autonomousStatus.activeBots.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Próxima Análise:</span>
                  <span className="ml-1 font-medium">
                    {Math.max(0, Math.round((autonomousStatus.nextAnalysis - Date.now()) / 60000))}m
                  </span>
                </div>
              </div>
              {autonomousStatus.activeBots.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Pares:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {autonomousStatus.activeBots.map(symbol => (
                      <Badge key={symbol} variant="outline" className="text-xs">
                        {symbol}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2">
          <p className="text-sm font-medium mb-2">Recent Training Rewards</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={simulatedRewards}>
              <XAxis 
                dataKey="episode" 
                tick={{ fontSize: 10 }} 
                tickCount={5} 
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}`, 'Reward']}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              />
              <Bar 
                dataKey="reward" 
                fill="url(#colorReward)" 
                radius={[4, 4, 0, 0]} 
              />
              <defs>
                <linearGradient id="colorReward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RLModelStatus;
