import { useEffect } from "react";
import { useRefreshTokenMutation } from "../api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials, clearCredentials } from "../slices/authReducer";
import Cookies from "js-cookie";

export const useAuth = () => {
  const dispatch = useDispatch();
  const [refreshToken] = useRefreshTokenMutation();

  useEffect(() => {
    let refreshTimeout;
    const refreshAccessToken = async () => {
      const refreshTokenCookie = Cookies.get("refresh_token");
      if (!refreshTokenCookie) {
        console.warn("No refresh token found in cookies. User might be logged out.");
        return;
      }
      try {
        const response = await refreshToken({ refreshToken: refreshTokenCookie }).unwrap();

        // Handle the new response structure: response.data contains accessToken and refreshToken
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update cookies and Redux state with new tokens
        Cookies.set("access_token", accessToken, { secure: true, sameSite: "Lax", expires: 1 }); // Expires in 1 day
        Cookies.set("refresh_token", newRefreshToken, { secure: true, sameSite: "Lax", expires: 90 }); // Expires in 90 days
        
        // Get current user from state to preserve it
        const currentUser = Cookies.get("user") ? JSON.parse(Cookies.get("user")) : null;
        dispatch(setCredentials({ 
          access_token: accessToken, 
          refresh_token: newRefreshToken,
          user: currentUser 
        }));
        
        // Refresh token every 15 minutes (900000 ms) - adjust based on token expiry
        const refreshInterval = 15 * 60 * 1000;
        refreshTimeout = setTimeout(refreshAccessToken, refreshInterval);
      } catch (err) {
        console.error("Error refreshing token:", err);
        if (err?.status === 401 || err?.status === '401') {
          dispatch(clearCredentials());
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          Cookies.remove("user");
        }
      }
    };
    refreshAccessToken();
    return () => clearTimeout(refreshTimeout);
  }, [refreshToken, dispatch]);
};
