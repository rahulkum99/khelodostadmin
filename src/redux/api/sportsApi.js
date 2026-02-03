import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

// Custom baseQuery using axios
const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method = 'get', data, params }) => {
    try {
      const result = await axios({
        url: baseUrl + url,
        method,
        data,
        params,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

// Normalize baseUrl to ensure it ends with /api (same as authApi)
const getSportsBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) {
    return 'http://localhost:5000/api';
  }
  // Remove trailing slash if present
  const cleanUrl = envUrl.replace(/\/$/, '');
  // Ensure it ends with /api
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const sportsApi = createApi({
  reducerPath: 'sportsApi',
  // Use API base URL from environment; fall back to relative proxy for dev
  baseQuery: axiosBaseQuery({ baseUrl: getSportsBaseUrl() }),
  endpoints: (builder) => ({
    getCricketData: builder.query({
      query: () => ({
        url: '/cricket',
        params: { sportname: 'cricket' },
      }),
      transformResponse: (response) => {
        try {
          return JSON.parse(response?.data || '[]');
        } catch (err) {
          console.error('Failed to parse cricket data', err);
          return [];
        }
      },
    }),
    getSoccerData: builder.query({
      query: () => ({
        url: '/cricket',
        params: { sportname: 'soccer' },
      }),
      transformResponse: (response) => {
        try {
          return JSON.parse(response?.data || '[]');
        } catch (err) {
          console.error('Failed to parse soccer data', err);
          return [];
        }
      },
    }),
    getTennisData: builder.query({
      query: () => ({
        url: '/cricket',
        params: { sportname: 'tennis' },
      }),
      transformResponse: (response) => {
        try {
          return JSON.parse(response?.data || '[]');
        } catch (err) {
          console.error('Failed to parse tennis data', err);
          return [];
        }
      },
    }),
    getEventData: builder.query({
      query: (eventId) => ({
        url: '/event-detail',
        params: { eventId },
      }),
      transformResponse: (response) => {
        try {
          // The API returns response.response as a JSON string
          const parsedResponse = typeof response?.response === 'string' 
            ? JSON.parse(response.response) 
            : response?.response || response;
          
          if (parsedResponse?.success && Array.isArray(parsedResponse?.data)) {
            return parsedResponse.data;
          }
          return [];
        } catch (err) {
          console.error('Failed to parse event data', err);
          return [];
        }
      },
    }),
  }),
});

export const { 
  useGetCricketDataQuery, 
  useGetSoccerDataQuery, 
  useGetTennisDataQuery,
  useGetEventDataQuery 
} = sportsApi;
