import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private protocols?: string | string[];
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed: boolean = false;
  private messageHandlers: Map<string, ((payload: any) => void)[]> = new Map();
  private connectionHandlers: {
    onOpen?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
  } = {};

  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.protocols = config.protocols;
    this.reconnectInterval = config.reconnectInterval || 3000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.connectionHandlers = {
      onOpen: config.onOpen,
      onClose: config.onClose,
      onError: config.onError,
    };
    
    if (config.onMessage) {
      this.subscribe('*', config.onMessage);
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;
    
    try {
      this.ws = new WebSocket(this.url, this.protocols);
      
      this.ws.onopen = (event) => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.connectionHandlers.onOpen?.(event);
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event.code, event.reason);
        this.connectionHandlers.onClose?.(event);
        
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        this.connectionHandlers.onError?.(event);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn('[WebSocket] Cannot send message - connection not open');
    }
  }

  subscribe(type: string, handler: (payload: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    this.messageHandlers.get(type)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle specific message type handlers
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message.payload));
    
    // Handle global message handlers
    const globalHandlers = this.messageHandlers.get('*') || [];
    globalHandlers.forEach(handler => handler(message));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// WebSocket hook for React components
export const useWebSocket = (config: WebSocketConfig) => {
  const [connectionState, setConnectionState] = useState<number>(WebSocket.CLOSED);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsManager = useRef<WebSocketManager | null>(null);

  useEffect(() => {
    wsManager.current = new WebSocketManager({
      ...config,
      onOpen: (event) => {
        setConnectionState(WebSocket.OPEN);
        config.onOpen?.(event);
      },
      onClose: (event) => {
        setConnectionState(WebSocket.CLOSED);
        config.onClose?.(event);
      },
      onError: (event) => {
        config.onError?.(event);
      },
      onMessage: (message) => {
        setLastMessage(message);
        config.onMessage?.(message);
      },
    });

    wsManager.current.connect();

    return () => {
      wsManager.current?.disconnect();
    };
  }, [config.url]);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    wsManager.current?.send(message);
  }, []);

  const subscribe = useCallback((type: string, handler: (payload: any) => void) => {
    return wsManager.current?.subscribe(type, handler) || (() => {});
  }, []);

  return {
    connectionState,
    lastMessage,
    sendMessage,
    subscribe,
    isConnected: connectionState === WebSocket.OPEN,
  };
};

// Real-time monitoring hooks
export const useServerMonitoring = (serverId?: string) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const { subscribe, isConnected } = useWebSocket({
    url: `ws://localhost:8000/ws/monitoring/servers/${serverId || 'all'}/`,
    onOpen: () => console.log('[ServerMonitoring] Connected'),
    onClose: () => console.log('[ServerMonitoring] Disconnected'),
    onError: (error) => console.error('[ServerMonitoring] Error:', error),
  });

  useEffect(() => {
    const unsubscribeMetrics = subscribe('server_metrics', (payload) => {
      setMetrics(payload);
    });

    const unsubscribeAlerts = subscribe('server_alert', (payload) => {
      setAlerts(prev => [payload, ...prev.slice(0, 19)]); // Keep last 20 alerts
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, [subscribe]);

  return {
    metrics,
    alerts,
    isConnected,
  };
};

export const useRackMonitoring = (rackId?: string) => {
  const [utilization, setUtilization] = useState<any>(null);
  const [powerMetrics, setPowerMetrics] = useState<any>(null);

  const { subscribe, isConnected } = useWebSocket({
    url: `ws://localhost:8000/ws/monitoring/racks/${rackId || 'all'}/`,
    onOpen: () => console.log('[RackMonitoring] Connected'),
    onClose: () => console.log('[RackMonitoring] Disconnected'),
    onError: (error) => console.error('[RackMonitoring] Error:', error),
  });

  useEffect(() => {
    const unsubscribeUtilization = subscribe('rack_utilization', (payload) => {
      setUtilization(payload);
    });

    const unsubscribePower = subscribe('rack_power', (payload) => {
      setPowerMetrics(payload);
    });

    return () => {
      unsubscribeUtilization();
      unsubscribePower();
    };
  }, [subscribe]);

  return {
    utilization,
    powerMetrics,
    isConnected,
  };
};

export const useVMMonitoring = (vmId?: string) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [status, setStatus] = useState<string>('unknown');

  const { subscribe, isConnected } = useWebSocket({
    url: `ws://localhost:8000/ws/monitoring/vms/${vmId || 'all'}/`,
    onOpen: () => console.log('[VMMonitoring] Connected'),
    onClose: () => console.log('[VMMonitoring] Disconnected'),
    onError: (error) => console.error('[VMMonitoring] Error:', error),
  });

  useEffect(() => {
    const unsubscribeMetrics = subscribe('vm_metrics', (payload) => {
      setMetrics(payload);
    });

    const unsubscribeStatus = subscribe('vm_status', (payload) => {
      setStatus(payload.status);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeStatus();
    };
  }, [subscribe]);

  return {
    metrics,
    status,
    isConnected,
  };
};

export const useClusterMonitoring = (clusterId?: string) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [pods, setPods] = useState<any[]>([]);

  const { subscribe, isConnected } = useWebSocket({
    url: `ws://localhost:8000/ws/monitoring/clusters/${clusterId || 'all'}/`,
    onOpen: () => console.log('[ClusterMonitoring] Connected'),
    onClose: () => console.log('[ClusterMonitoring] Disconnected'),
    onError: (error) => console.error('[ClusterMonitoring] Error:', error),
  });

  useEffect(() => {
    const unsubscribeMetrics = subscribe('cluster_metrics', (payload) => {
      setMetrics(payload);
    });

    const unsubscribeNodes = subscribe('cluster_nodes', (payload) => {
      setNodes(payload);
    });

    const unsubscribePods = subscribe('cluster_pods', (payload) => {
      setPods(payload);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeNodes();
      unsubscribePods();
    };
  }, [subscribe]);

  return {
    metrics,
    nodes,
    pods,
    isConnected,
  };
}; 