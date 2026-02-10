import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Normalize baseUrl to ensure it ends with /api
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) {
    return 'http://localhost:5000/api';
  }
  // Remove trailing slash if present
  const cleanUrl = envUrl.replace(/\/$/, '');
  // Ensure it ends with /api
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const baseQuery = fetchBaseQuery({
  // You can override this with VITE_API_BASE_URL, otherwise it falls back to the local backend
  baseUrl: getBaseUrl(),
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
  tagTypes: ['Auth', 'Users', 'Wallet', 'Bets'],
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
    getUserActivityLogs: builder.query({
      query: ({ userId, page = 1, limit = 20, activityType } = {}) => ({
        url: '/auth/activity-logs/user',
        method: 'GET',
        params: {
          userId,
          page,
          limit,
          ...(activityType ? { activityType } : {}),
        },
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
    getPasswordChangeHistory: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/auth/password-change-history',
        method: 'GET',
        params: { page, limit },
      }),
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
      }),
    }),
    getWalletBalance: builder.query({
      query: () => ({
        url: '/wallet/me/balance',
        method: 'GET',
      }),
      providesTags: ['Wallet'],
    }),
    getWalletDetails: builder.query({
      query: () => ({
        url: '/wallet/me',
        method: 'GET',
      }),
      providesTags: ['Wallet'],
    }),
    getWalletTransactions: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/wallet/me/transactions',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['Wallet'],
    }),
    getWalletTransactionsByUserId: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => ({
        url: `/wallet/${userId}/transactions`,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (result, error, { userId }) => [{ type: 'Wallet', id: userId }],
    }),
    addAmountToWallet: builder.mutation({
      query: (body) => ({
        url: '/wallet/add',
        method: 'POST',
        body: {
          amount: body.amount,
          ...(body.description && { description: body.description }),
        },
      }),
      invalidatesTags: ['Wallet'],
    }),
    getAdminBetList: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: '/bets/admin/bet-list',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['Bets'],
    }),
    getUserBets: builder.query({
      query: ({ userId, page = 1, limit = 10 } = {}) => ({
        url: `/bets/admin/users/${userId}/bets`,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (result, error, { userId }) => [{ type: 'Bets', id: userId }],
    }),
  }),
});

export const {
  useRefreshTokenMutation,
  useLoginMutation,
  useGetActivityLogsQuery,
  useGetUserActivityLogsQuery,
  useCreateUserMutation,
  useGetUsersQuery,
  useGetPasswordChangeHistoryQuery,
  useChangePasswordMutation,
  useGetWalletBalanceQuery,
  useGetWalletDetailsQuery,
  useGetWalletTransactionsQuery,
  useGetWalletTransactionsByUserIdQuery,
  useAddAmountToWalletMutation,
  useGetAdminBetListQuery,
  useGetUserBetsQuery,
} = authApi;



