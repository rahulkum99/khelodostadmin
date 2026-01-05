import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

const initialState = {
  access_token: Cookies.get("access_token") || null,
  refresh_token: Cookies.get("refresh_token") || null,
  user: Cookies.get("user") ? JSON.parse(Cookies.get("user")) : null,
  isAuthenticated: !!Cookies.get("access_token"), // True if token exists
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      console.log(action);
      const { access_token, refresh_token, user } = action.payload;

      state.access_token = access_token;
      state.refresh_token = refresh_token;
      state.user = user || null;
      state.isAuthenticated = true;

      // Store tokens securely in cookies with longer expiration
      Cookies.set("access_token", access_token, { secure: true, sameSite: "Lax", expires: 1 }); // Expires in 1 day
      Cookies.set("refresh_token", refresh_token, { secure: true, sameSite: "Lax", expires: 90 }); // Expires in 90 days
      if (user) {
        Cookies.set("user", JSON.stringify(user), { secure: true, sameSite: "Lax", expires: 90 });
      }
    },

    clearCredentials: (state) => {
      state.access_token = null;
      state.refresh_token = null;
      state.user = null;
      state.isAuthenticated = false;

      // Remove cookies
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("user");
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const refreshSelector = (state) => state.auth.refresh_token;
export const isAuthenticatedSelector = (state) => state.auth.isAuthenticated;
export const userSelector = (state) => state.auth.user;
