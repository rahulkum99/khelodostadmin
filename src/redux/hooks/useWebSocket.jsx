import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import websocketService from '../../services/websocketService';
import {
  setCricketData,
  setSoccerData,
  setTennisData,
  updateCricketData,
  updateSoccerData,
  updateTennisData,
  setConnectionStatus,
} from '../slices/websocketReducer';

/**
 * Custom hook to manage WebSocket connections and data for sports
 * @param {Array<string>} sports - Array of sports to subscribe to: ['cricket', 'soccer', 'tennis'] or ['cricket_matches', 'soccer_matches', 'tennis_matches']
 * @param {string} url - WebSocket URL (default: 'ws://localhost:5000' or 'http://localhost:5000')
 * @returns {Object} - { data, isConnected, error, connectionStatus }
 */
export const useWebSocket = (sports = ['cricket', 'soccer', 'tennis'], url = 'ws://localhost:5000') => {
  const dispatch = useDispatch();
  const websocketState = useSelector((state) => state.websocket);
  const subscriptionsRef = useRef(new Set());

  useEffect(() => {
    // Connect WebSocket
    websocketService.connect(url);

    // Set up connection status listeners
    const handleOpen = () => {
      dispatch(setConnectionStatus('connected'));
    };

    const handleClose = () => {
      dispatch(setConnectionStatus('disconnected'));
    };

    const handleError = () => {
      dispatch(setConnectionStatus('error'));
    };

    websocketService.addListener('open', handleOpen);
    websocketService.addListener('close', handleClose);
    websocketService.addListener('error', handleError);

    // Set up data listeners for each sport
    const cricketHandler = (data) => {
      if (Array.isArray(data) && data.length > 0) {
        dispatch(setCricketData(data));
      } else if (data && typeof data === 'object') {
        dispatch(updateCricketData([data]));
      }
    };

    const soccerHandler = (data) => {
      if (Array.isArray(data) && data.length > 0) {
        dispatch(setSoccerData(data));
      } else if (data && typeof data === 'object') {
        dispatch(updateSoccerData([data]));
      }
    };

    const tennisHandler = (data) => {
      if (Array.isArray(data) && data.length > 0) {
        dispatch(setTennisData(data));
      } else if (data && typeof data === 'object') {
        dispatch(updateTennisData([data]));
      }
    };

    // Map event names to internal sport names
    // Backend emits: 'cricket_matches', 'soccer_matches', 'tennis_matches'
    // We map these to: 'cricket', 'soccer', 'tennis' for internal use
    
    // Subscribe to requested sports (supports both 'cricket' and 'cricket_matches' formats)
    if (sports.includes('cricket') || sports.includes('cricket_matches')) {
      websocketService.addListener('cricket', cricketHandler);
      subscriptionsRef.current.add('cricket');
      if (websocketService.isConnected()) {
        websocketService.subscribe('cricket_matches');
      }
    }

    if (sports.includes('soccer') || sports.includes('soccer_matches')) {
      websocketService.addListener('soccer', soccerHandler);
      subscriptionsRef.current.add('soccer');
      if (websocketService.isConnected()) {
        websocketService.subscribe('soccer_matches');
      }
    }

    if (sports.includes('tennis') || sports.includes('tennis_matches')) {
      websocketService.addListener('tennis', tennisHandler);
      subscriptionsRef.current.add('tennis');
      if (websocketService.isConnected()) {
        websocketService.subscribe('tennis_matches');
      }
    }

    // Subscribe when connection is established
    const handleConnected = () => {
      if (sports.includes('cricket') || sports.includes('cricket_matches')) {
        websocketService.subscribe('cricket_matches');
      }
      if (sports.includes('soccer') || sports.includes('soccer_matches')) {
        websocketService.subscribe('soccer_matches');
      }
      if (sports.includes('tennis') || sports.includes('tennis_matches')) {
        websocketService.subscribe('tennis_matches');
      }
    };

    websocketService.addListener('open', handleConnected);

    // Cleanup
    return () => {
      websocketService.removeListener('open', handleOpen);
      websocketService.removeListener('close', handleClose);
      websocketService.removeListener('error', handleError);
      websocketService.removeListener('open', handleConnected);

      if (sports.includes('cricket') || sports.includes('cricket_matches')) {
        websocketService.removeListener('cricket', cricketHandler);
        websocketService.unsubscribe('cricket_matches');
        subscriptionsRef.current.delete('cricket');
      }

      if (sports.includes('soccer') || sports.includes('soccer_matches')) {
        websocketService.removeListener('soccer', soccerHandler);
        websocketService.unsubscribe('soccer_matches');
        subscriptionsRef.current.delete('soccer');
      }

      if (sports.includes('tennis') || sports.includes('tennis_matches')) {
        websocketService.removeListener('tennis', tennisHandler);
        websocketService.unsubscribe('tennis_matches');
        subscriptionsRef.current.delete('tennis');
      }
    };
  }, [dispatch, url, JSON.stringify(sports)]);

  // Get combined data for requested sports
  const getData = (sport) => {
    return websocketState[sport]?.data || [];
  };

  const getConnectionStatus = () => {
    return websocketState.connectionStatus;
  };

  const isConnected = websocketService.isConnected();

  return {
    cricketData: (sports.includes('cricket') || sports.includes('cricket_matches')) ? getData('cricket') : [],
    soccerData: (sports.includes('soccer') || sports.includes('soccer_matches')) ? getData('soccer') : [],
    tennisData: (sports.includes('tennis') || sports.includes('tennis_matches')) ? getData('tennis') : [],
    isConnected,
    connectionStatus: getConnectionStatus(),
    websocketState,
  };
};

/**
 * Hook to get WebSocket data for a specific sport
 * @param {string} sport - 'cricket', 'soccer', or 'tennis'
 * @param {string} url - WebSocket URL
 * @returns {Array} - Array of sport data
 */
export const useWebSocketSport = (sport, url = 'ws://localhost:5000') => {
  const { cricketData, soccerData, tennisData, isConnected, connectionStatus } = useWebSocket([sport], url);
  
  const dataMap = {
    cricket: cricketData,
    soccer: soccerData,
    tennis: tennisData,
  };

  return {
    data: dataMap[sport] || [],
    isConnected,
    connectionStatus,
  };
};

export default useWebSocket;

