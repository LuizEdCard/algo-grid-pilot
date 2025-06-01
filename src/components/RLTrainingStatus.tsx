
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RealBinanceService, TrainingStatus } from '../services/realBinanceService';

const RLTrainingStatus = () => {
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrainingStatus = async () => {
      try {
        const status = await RealBinanceService.getTrainingStatus();
        setTrainingStatus(status);
      } catch (error) {
        console.error('Failed to fetch training status:', error);
        setTrainingStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainingStatus();
    
    // Atualizar a cada 5 segundos durante treinamento
    const interval = setInterval(fetchTrainingStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RL Training Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trainingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RL Training Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Training status unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RL Training Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Status</span>
          <span className={trainingStatus.training ? 'text-green-500' : 'text-muted-foreground'}>
            {trainingStatus.training ? 'Training' : 'Idle'}
          </span>
        </div>
        
        {trainingStatus.training && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(trainingStatus.progress * 100)}%</span>
              </div>
              <Progress value={trainingStatus.progress * 100} />
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Episode</span>
              <span>{trainingStatus.current_episode} / {trainingStatus.total_episodes}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RLTrainingStatus;
