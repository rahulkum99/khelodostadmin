import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.access_token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    refreshToken: builder.mutation({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: { refresh_token: body.refreshCookie },
      }),
    }),
  }),
});

export const { useRefreshTokenMutation } = authApi;



