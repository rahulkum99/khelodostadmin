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
      query: ({ page = 1, limit = 20, fromDate, toDate, action } = {}) => ({
        url: '/wallet/me/transactions',
        method: 'GET',
        params: {
          page,
          limit,
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
          ...(action && { action }),
        },
      }),
      providesTags: ['Wallet'],
    }),
    getWalletTransactionsByUserId: builder.query({
      query: ({ userId, page = 1, limit = 20, fromDate, toDate, action } = {}) => ({
        url: `/wallet/${userId}/transactions`,
        method: 'GET',
        params: {
          page,
          limit,
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
          ...(action && { action }),
        },
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
    getBankingUsers: builder.query({
      query: () => ({
        url: '/wallet/banking/users',
        method: 'GET',
      }),
      providesTags: ['Wallet'],
    }),
    getBankingAdmins: builder.query({
      query: () => ({
        url: '/wallet/banking/admins',
        method: 'GET',
      }),
      providesTags: ['Wallet'],
    }),
    walletBulkAction: builder.mutation({
      query: (body) => ({
        url: '/wallet/bulk/action',
        method: 'POST',
        body: {
          adminPassword: body.adminPassword,
          entries: body.entries,
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
    getUserProfitLoss: builder.query({
      query: ({ userId, sport } = {}) => ({
        url: '/bets/admin/user-profit-loss',
        method: 'GET',
        params: {
          userId,
          ...(sport ? { sport } : {}),
        },
      }),
      providesTags: (result, error, { userId }) => [{ type: 'Bets', id: `profit-loss-${userId}` }],
    }),
    getUserEventProfitLoss: builder.query({
      query: ({ userId, eventId, by } = {}) => ({
        url: '/bets/admin/user-event-profit-loss',
        method: 'GET',
        params: {
          userId,
          eventId,
          ...(by ? { by } : {}),
        },
      }),
      providesTags: (result, error, { userId, eventId }) => [
        { type: 'Bets', id: `event-pl-${userId}-${eventId}` },
      ],
    }),
    getHierarchyProfitLoss: builder.query({
      query: ({ sport, from, to } = {}) => ({
        url: '/bets/admin/hierarchy-profit-loss',
        method: 'GET',
        params: {
          ...(sport ? { sport } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),
      providesTags: ['Bets'],
    }),
    getHierarchySettledBets: builder.query({
      query: ({ sport, from, to, marketName } = {}) => ({
        url: '/bets/admin/hierarchy-settled-bets',
        method: 'GET',
        params: {
          ...(sport ? { sport } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(marketName ? { marketName } : {}),
        },
      }),
      providesTags: ['Bets'],
    }),
    getTodayInplayPlacedBets: builder.query({
      query: () => ({
        // Full URL: <VITE_API_BASE_URL>/api/bets/today-inplay-placed-bets
        url: '/bets/today-inplay-placed-bets',
        method: 'GET',
      }),
      transformResponse: (response) => {
        // Expecting { success: boolean, data: [...] }
        if (response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      },
      providesTags: ['Bets'],
    }),
    getMarketAnalysis: builder.query({
      query: (eventId) => ({
        url: '/bets/admin/market-analysis',
        method: 'GET',
        params: { eventId },
      }),
      transformResponse: (response) => {
        if (response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      },
      providesTags: (result, error, eventId) => [
        { type: 'Bets', id: `market-analysis-${eventId}` },
      ],
    }),
    getHierarchyMarketBets: builder.query({
      query: ({ eventId, sport } = {}) => ({
        url: '/bets/admin/hierarchy-market-bets',
        method: 'GET',
        params: {
          ...(eventId ? { eventId } : {}),
          ...(sport ? { sport } : {}),
        },
      }),
      transformResponse: (response) => {
        if (response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      },
      providesTags: (result, error, { eventId }) => [
        { type: 'Bets', id: `market-bets-${eventId}` },
      ],
    }),
    getHierarchyUserMarketProfitLoss: builder.query({
      query: ({ eventId, marketId, marketType } = {}) => ({
        url: '/bets/admin/hierarchy-user-market-profit-loss',
        method: 'GET',
        params: {
          ...(eventId ? { eventId } : {}),
          ...(marketId ? { marketId } : {}),
          ...(marketType ? { marketType } : {}),
        },
      }),
      transformResponse: (response) => {
        if (response?.success && response?.data) return response.data;
        return null;
      },
      providesTags: (result, error, { eventId, marketId }) => [
        { type: 'Bets', id: `hierarchy-pl-${eventId}-${marketId}` },
      ],
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
  useGetBankingUsersQuery,
  useGetBankingAdminsQuery,
  useWalletBulkActionMutation,
  useGetAdminBetListQuery,
  useGetUserBetsQuery,
  useGetUserProfitLossQuery,
  useGetUserEventProfitLossQuery,
  useGetHierarchyProfitLossQuery,
  useGetHierarchySettledBetsQuery,
  useGetTodayInplayPlacedBetsQuery,
  useGetMarketAnalysisQuery,
  useGetHierarchyMarketBetsQuery,
  useGetHierarchyUserMarketProfitLossQuery,
} = authApi;



