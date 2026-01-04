import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authReducer';
import websocketReducer from './slices/websocketReducer';
import { authApi } from './api/authApi';
import { sportsApi } from './api/sportsApi';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        websocket: websocketReducer,
        [authApi.reducerPath]: authApi.reducer,
        // [sportsApi.reducerPath]: sportsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
});