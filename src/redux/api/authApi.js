import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  // You can override this with VITE_API_BASE_URL, otherwise it falls back to the local backend
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
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
  tagTypes: ['Auth', 'Users'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ username, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: { username, password },
      }),
    }),
    refreshToken: builder.mutation({
      query: (body) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body: { refreshToken: body.refreshToken },
      }),
    }),
    getActivityLogs: builder.query({
      query: () => ({
        url: '/auth/activity-logs',
        method: 'GET',
      }),
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: '/user/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Users'],
    }),
    getUsers: builder.query({
      query: ({ role = 'user', page = 1, limit = 10 } = {}) => ({
        url: '/user/',
        method: 'GET',
        params: { role, page, limit },
      }),
      providesTags: ['Users'],
    }),
  }),
});

export const { useRefreshTokenMutation, useLoginMutation, useGetActivityLogsQuery, useCreateUserMutation, useGetUsersQuery } = authApi;



