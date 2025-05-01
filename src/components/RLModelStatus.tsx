
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RLState } from "../types/trading";
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
  
  // Generate simulated reward data for visualization
  useEffect(() => {
    const data = Array(20).fill(0).map((_, idx) => ({
      episode: idx + 1,
      reward: Math.sin(idx / 3) * 10 + 20 + performance * 10 + (Math.random() - 0.5) * 5
    }));
    setSimulatedRewards(data);
  }, [performance]);

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
