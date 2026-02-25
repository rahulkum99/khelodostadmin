import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.socketListeners = new Set(); // Track which events have socket.on() set up
    this.isConnecting = false;
    this.subscriptions = {
      cricket_matches: false,
      soccer_matches: false,
      tennis_matches: false,
    };
  }

  connect(url = null) {
    const defaultUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5000';
    const rawUrl = url || defaultUrl;
    // Convert ws:// to http:// for Socket.IO
    const socketUrl = rawUrl.replace(/^ws:\/\//, 'http://').replace(/^wss:\/\//, 'https://');

    if (this.socket?.connected) {
      console.log('Socket.IO already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('Socket.IO connection already in progress');
      return;
    }

    this.isConnecting = true;
    this.url = socketUrl;

    try {
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected:', this.socket.id);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyListeners('open', null);

        // Set up event listeners for sports data
        this.setupEventListeners();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnecting = false;
        this.notifyListeners('close', null);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnecting = false;
        this.notifyListeners('error', error);
      });

      this.socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
        this.notifyListeners('error', error);
      });
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.isConnecting = false;
      this.notifyListeners('error', error);
    }
  }

  setupEventListeners() {
    // Listen for cricket_matches event
    this.socket.on('cricket_matches', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        this.notifyListeners('cricket', data);
      } else if (data && typeof data === 'object') {
        this.notifyListeners('cricket', [data]);
      }
    });

    // Listen for soccer_matches event
    this.socket.on('soccer_matches', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        this.notifyListeners('soccer', data);
      } else if (data && typeof data === 'object') {
        this.notifyListeners('soccer', [data]);
      }
    });

    // Listen for tennis_matches event
    this.socket.on('tennis_matches', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        this.notifyListeners('tennis', data);
      } else if (data && typeof data === 'object') {
        this.notifyListeners('tennis', [data]);
      }
    });
  }

  subscribeToEvent(eventId, sport = 'cricket') {
    if (!this.socket || !this.socket.connected) {
      console.warn(`Cannot subscribe to ${sport} event ${eventId}: Socket.IO not connected`);
      return;
    }

    // Validate eventId exists (including 0 as valid)
    if (eventId === undefined || eventId === null || eventId === '') {
      console.error(`Invalid eventId for ${sport} event subscription:`, eventId);
      return;
    }

    // Convert eventId to string (backend expects string)
    const eventIdString = String(eventId).trim();
    if (!eventIdString || eventIdString === 'undefined' || eventIdString === 'null' || eventIdString === 'NaN') {
      console.error(
        `Invalid eventId string for ${sport} event subscription:`,
        eventId,
        'converted to:',
        eventIdString,
      );
      return;
    }

    const eventKey = `${sport}_event_${eventIdString}`;

    // Set up socket.on() listener for this specific event if not already set up
    // Use separate socketListeners Set to track this (not the callback listeners Map)
    if (!this.socketListeners.has(eventKey)) {
      this.socketListeners.add(eventKey);

      // Listen for this specific event (only set up once)
      this.socket.on(eventKey, (data) => {
        console.log(
          `Received ${eventKey} data:`,
          typeof data,
          Array.isArray(data) ? `${data.length} items` : 'object',
        );
        this.notifyListeners(eventKey, data);
      });
    }

    // Emit subscription message based on sport
    const subscribeEvent = `subscribe_${sport}_event`;
    console.log(`Emitting ${subscribeEvent} with eventId:`, eventIdString);
    this.socket.emit(subscribeEvent, eventIdString);
  }

  unsubscribeFromEvent(eventId, sport = 'cricket') {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    // Validate eventId exists (including 0 as valid)
    if (eventId === undefined || eventId === null || eventId === '') {
      return;
    }

    // Convert eventId to string (backend expects string)
    const eventIdString = String(eventId).trim();
    if (!eventIdString || eventIdString === 'undefined' || eventIdString === 'null' || eventIdString === 'NaN') {
      return;
    }

    const eventKey = `${sport}_event_${eventIdString}`;
    const unsubscribeEvent = `unsubscribe_${sport}_event`;

    console.log(`Emitting ${unsubscribeEvent} with eventId:`, eventIdString);
    this.socket.emit(unsubscribeEvent, eventIdString);

    // Remove socket.on() listener for this specific event
    if (this.socket) {
      this.socket.off(eventKey);
    }
    this.socketListeners.delete(eventKey);
    this.listeners.delete(eventKey);
  }

  subscribe(sport) {
    // Socket.IO server broadcasts to all clients automatically
    // No subscription needed, but we track it for consistency
    this.subscriptions[sport] = true;
    console.log(`Subscribed to ${sport} (server broadcasts automatically)`);
  }

  unsubscribe(sport) {
    this.subscriptions[sport] = false;
    console.log(`Unsubscribed from ${sport}`);
  }

  addListener(sport, callback) {
    if (!this.listeners.has(sport)) {
      this.listeners.set(sport, new Set());
    }
    this.listeners.get(sport).add(callback);
  }

  removeListener(sport, callback) {
    if (this.listeners.has(sport)) {
      this.listeners.get(sport).delete(callback);
    }
  }

  notifyListeners(sport, data) {
    if (this.listeners.has(sport)) {
      this.listeners.get(sport).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in Socket.IO listener for ${sport}:`, error);
        }
      });
    }
  }

  attemptReconnect() {
    // Socket.IO handles reconnection automatically
    // This method is kept for compatibility but doesn't need to do anything
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    this.reconnectAttempts += 1;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    this.subscriptions = {
      cricket_matches: false,
      soccer_matches: false,
      tennis_matches: false,
    };
    this.socketListeners.clear();
    this.reconnectAttempts = 0;
  }

  getReadyState() {
    if (!this.socket) return 3; // CLOSED
    if (this.socket.connected) return 1; // OPEN
    return 3; // CLOSED
  }

  isConnected() {
    return this.socket?.connected === true;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;

