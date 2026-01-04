import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cricket: {
    data: [],
    lastUpdate: null,
    isConnected: false,
    error: null,
  },
  soccer: {
    data: [],
    lastUpdate: null,
    isConnected: false,
    error: null,
  },
  tennis: {
    data: [],
    lastUpdate: null,
    isConnected: false,
    error: null,
  },
  eventDetails: {
    // Store event details by eventId: { [eventId]: { data: [], lastUpdate: null, error: null } }
    data: {},
  },
  connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected', 'error'
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setCricketData: (state, action) => {
      state.cricket.data = action.payload;
      state.cricket.lastUpdate = new Date().toISOString();
      state.cricket.error = null;
    },
    setSoccerData: (state, action) => {
      state.soccer.data = action.payload;
      state.soccer.lastUpdate = new Date().toISOString();
      state.soccer.error = null;
    },
    setTennisData: (state, action) => {
      state.tennis.data = action.payload;
      state.tennis.lastUpdate = new Date().toISOString();
      state.tennis.error = null;
    },
    updateCricketData: (state, action) => {
      // Update existing data or add new items
      const newData = action.payload;
      if (Array.isArray(newData)) {
        // Merge with existing data, updating by gameId
        const existingMap = new Map(state.cricket.data.map(item => [item.gameId, item]));
        newData.forEach(item => {
          if (item.gameId) {
            existingMap.set(item.gameId, { ...existingMap.get(item.gameId), ...item });
          }
        });
        state.cricket.data = Array.from(existingMap.values());
        state.cricket.lastUpdate = new Date().toISOString();
      }
    },
    updateSoccerData: (state, action) => {
      const newData = action.payload;
      if (Array.isArray(newData)) {
        const existingMap = new Map(state.soccer.data.map(item => [item.gameId || item.gmid, item]));
        newData.forEach(item => {
          const id = item.gameId || item.gmid;
          if (id) {
            existingMap.set(id, { ...existingMap.get(id), ...item });
          }
        });
        state.soccer.data = Array.from(existingMap.values());
        state.soccer.lastUpdate = new Date().toISOString();
      }
    },
    updateTennisData: (state, action) => {
      const newData = action.payload;
      if (Array.isArray(newData)) {
        const existingMap = new Map(state.tennis.data.map(item => [item.gameId || item.gmid, item]));
        newData.forEach(item => {
          const id = item.gameId || item.gmid;
          if (id) {
            existingMap.set(id, { ...existingMap.get(id), ...item });
          }
        });
        state.tennis.data = Array.from(existingMap.values());
        state.tennis.lastUpdate = new Date().toISOString();
      }
    },
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    setCricketError: (state, action) => {
      state.cricket.error = action.payload;
    },
    setSoccerError: (state, action) => {
      state.soccer.error = action.payload;
    },
    setTennisError: (state, action) => {
      state.tennis.error = action.payload;
    },
    clearCricketData: (state) => {
      state.cricket.data = [];
      state.cricket.lastUpdate = null;
    },
    clearSoccerData: (state) => {
      state.soccer.data = [];
      state.soccer.lastUpdate = null;
    },
    clearTennisData: (state) => {
      state.tennis.data = [];
      state.tennis.lastUpdate = null;
    },
    setEventDetailData: (state, action) => {
      const { eventId, data, sport = 'cricket' } = action.payload;
      const eventDataKey = `${sport}_${eventId}`;
      if (!state.eventDetails.data[eventDataKey]) {
        state.eventDetails.data[eventDataKey] = {
          data: [],
          lastUpdate: null,
          error: null,
        };
      }
      state.eventDetails.data[eventDataKey].data = data;
      state.eventDetails.data[eventDataKey].lastUpdate = new Date().toISOString();
      state.eventDetails.data[eventDataKey].error = null;
    },
    updateEventDetailData: (state, action) => {
      const { eventId, data, sport = 'cricket' } = action.payload;
      const eventDataKey = `${sport}_${eventId}`;
      if (!state.eventDetails.data[eventDataKey]) {
        state.eventDetails.data[eventDataKey] = {
          data: [],
          lastUpdate: null,
          error: null,
        };
      }
      // Merge/update event detail data
      state.eventDetails.data[eventDataKey].data = data;
      state.eventDetails.data[eventDataKey].lastUpdate = new Date().toISOString();
    },
    clearEventDetailData: (state, action) => {
      const { eventId, sport = 'cricket' } = action.payload;
      const eventDataKey = `${sport}_${eventId}`;
      if (state.eventDetails.data[eventDataKey]) {
        delete state.eventDetails.data[eventDataKey];
      }
    },
    setEventDetailError: (state, action) => {
      const { eventId, error, sport = 'cricket' } = action.payload;
      const eventDataKey = `${sport}_${eventId}`;
      if (!state.eventDetails.data[eventDataKey]) {
        state.eventDetails.data[eventDataKey] = {
          data: [],
          lastUpdate: null,
          error: null,
        };
      }
      state.eventDetails.data[eventDataKey].error = error;
    },
  },
});

export const {
  setCricketData,
  setSoccerData,
  setTennisData,
  updateCricketData,
  updateSoccerData,
  updateTennisData,
  setConnectionStatus,
  setCricketError,
  setSoccerError,
  setTennisError,
  clearCricketData,
  clearSoccerData,
  clearTennisData,
  setEventDetailData,
  updateEventDetailData,
  clearEventDetailData,
  setEventDetailError,
} = websocketSlice.actions;

export default websocketSlice.reducer;

