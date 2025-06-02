
import { useState, useCallback } from 'react';
import { NotificationItem } from '../components/NotificationCenter';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    action?: { label: string; callback: () => void }
  ) => {
    const notification: NotificationItem = {
      id: `notification-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      action
    };

    setNotifications(prev => [notification, ...prev]);
    return notification.id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Convenience methods for different notification types
  const notifySuccess = useCallback((title: string, message: string, action?: { label: string; callback: () => void }) => {
    return addNotification('success', title, message, action);
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string, action?: { label: string; callback: () => void }) => {
    return addNotification('error', title, message, action);
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message: string, action?: { label: string; callback: () => void }) => {
    return addNotification('info', title, message, action);
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message: string, action?: { label: string; callback: () => void }) => {
    return addNotification('warning', title, message, action);
  }, [addNotification]);

  // Trading-specific notifications
  const notifyBotStarted = useCallback((symbol: string) => {
    return notifySuccess(
      'Bot Iniciado',
      `Grid trading iniciado para ${symbol}`,
      {
        label: 'Ver Status',
        callback: () => console.log(`View status for ${symbol}`)
      }
    );
  }, [notifySuccess]);

  const notifyBotStopped = useCallback((symbol: string) => {
    return notifyInfo('Bot Parado', `Grid trading parado para ${symbol}`);
  }, [notifyInfo]);

  const notifyBotError = useCallback((symbol: string, error: string) => {
    return notifyError(
      'Erro no Bot',
      `Erro em ${symbol}: ${error}`,
      {
        label: 'Tentar Novamente',
        callback: () => console.log(`Retry for ${symbol}`)
      }
    );
  }, [notifyError]);

  const notifyTrade = useCallback((symbol: string, side: string, price: number, quantity: number) => {
    return notifySuccess(
      'Trade Executado',
      `${side} ${quantity} ${symbol} a $${price.toFixed(2)}`
    );
  }, [notifySuccess]);

  const notifyNoFuturesMarket = useCallback((symbol: string) => {
    return notifyWarning(
      'Mercado Não Disponível',
      `${symbol} não possui mercado de futuros disponível`
    );
  }, [notifyWarning]);

  return {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    markAllAsRead,
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    notifyBotStarted,
    notifyBotStopped,
    notifyBotError,
    notifyTrade,
    notifyNoFuturesMarket
  };
};
