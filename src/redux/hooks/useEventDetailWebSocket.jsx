import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import websocketService from '../../services/websocketService';
import {
  setEventDetailData,
  updateEventDetailData,
  clearEventDetailData,
  setEventDetailError,
} from '../slices/websocketReducer';

/**
 * Hook to manage WebSocket connection for event detail data
 * @param {string} eventId - Event ID to subscribe to
 * @param {string} sport - Sport type: 'cricket', 'tennis', or 'soccer' (default: 'cricket')
 * @param {string} url - WebSocket URL (default: 'ws://localhost:5000')
 * @returns {Object} - { data, isConnected, error, connectionStatus }
 */
export const useEventDetailWebSocket = (eventId, sport = 'cricket', url = 'ws://localhost:5000') => {
  const dispatch = useDispatch();
  const websocketState = useSelector((state) => state.websocket);
  const handlerRef = useRef(null);

  useEffect(() => {
    // Validate eventId exists (including 0 as valid)
    if (eventId === undefined || eventId === null || eventId === '') {
      return;
    }

    // Convert eventId to string (backend expects string)
    const eventIdString = String(eventId).trim();
    
    // Validate eventId is not empty after conversion
    if (!eventIdString || eventIdString === 'undefined' || eventIdString === 'null' || eventIdString === 'NaN') {
      console.warn(`Invalid eventId for ${sport} event:`, eventId, 'converted to:', eventIdString);
      return;
    }

    // Ensure WebSocket is connected
    websocketService.connect(url);

    // Set up data handler for this specific event
    const eventKey = `${sport}_event_${eventIdString}`;
    const dataHandler = (data) => {
      if (Array.isArray(data) && data.length > 0) {
        dispatch(setEventDetailData({ eventId: eventIdString, data, sport }));
      } else if (data && typeof data === 'object') {
        dispatch(updateEventDetailData({ eventId: eventIdString, data: Array.isArray(data) ? data : [data], sport }));
      }
    };

    handlerRef.current = dataHandler;
    websocketService.addListener(eventKey, dataHandler);

    // Subscribe to the event when socket is connected
    const handleConnected = () => {
      if (websocketService.isConnected()) {
        websocketService.subscribeToEvent(eventIdString, sport);
      }
    };

    // If already connected, subscribe immediately
    if (websocketService.isConnected()) {
      websocketService.subscribeToEvent(eventIdString, sport);
    } else {
      // Wait for connection
      websocketService.addListener('open', handleConnected);
    }

    // Cleanup
    return () => {
      websocketService.removeListener(eventKey, dataHandler);
      websocketService.removeListener('open', handleConnected);
      websocketService.unsubscribeFromEvent(eventIdString, sport);
    };
  }, [dispatch, eventId, sport, url]);

  // Get data for this event (store by sport and eventId)
  // Convert eventId to string for consistency
  const eventIdString = eventId ? String(eventId).trim() : '';
  const eventDataKey = eventIdString ? `${sport}_${eventIdString}` : null;
  const eventData = eventDataKey && websocketState.eventDetails?.data?.[eventDataKey] ? websocketState.eventDetails.data[eventDataKey] : {
    data: [],
    lastUpdate: null,
    error: null,
  };

  const isConnected = websocketService.isConnected();

  return {
    data: eventData.data || [],
    lastUpdate: eventData.lastUpdate,
    error: eventData.error,
    isConnected,
    connectionStatus: websocketState.connectionStatus,
  };
};

export default useEventDetailWebSocket;

