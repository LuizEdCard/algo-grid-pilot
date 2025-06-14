
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RealFlaskApiService from '../services/realApiService';

const BackendStatus = () => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkBackendStatus = async () => {
    try {
      await RealFlaskApiService.checkStatus();
      setStatus('connected');
    } catch (error) {
      console.error('Backend connection failed:', error);
      setStatus('error');
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Verificar status a cada 30 segundos
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'error': return 'Disconnected';
      default: return 'Connecting...';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Backend Status</span>
          <span className={`text-xs ${getStatusColor()}`}>
            ● {getStatusText()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground">
          Last check: {lastCheck.toLocaleTimeString()}
        </div>
        {status === 'error' && (
          <div className="text-xs text-red-400 mt-1">
            Make sure Flask backend is running on http://localhost:5000
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackendStatus;
