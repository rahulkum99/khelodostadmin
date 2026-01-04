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
      const refreshCookie = Cookies.get("refresh_token");
      if (!refreshCookie) {
        console.warn("No refresh token found in cookies. User might be logged out.");
        return;
      }
      try {
        const data = await refreshToken({ refreshCookie }).unwrap();

        // Update cookies and Redux state
        Cookies.set("access_token", data.access, { secure: true, sameSite: "Lax", expires: 90 });
        dispatch(setCredentials({ access_token: data.access, refresh_token: refreshCookie }));
        const refreshInterval = 1 * 60 * 1000;
        refreshTimeout = setTimeout(refreshAccessToken, refreshInterval);
      } catch (err) {
        console.error("Error refreshing token:", err);
        if (err?.status === 401 || err?.status === '401') {
          dispatch(clearCredentials());
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
        }
      }
    };
    refreshAccessToken();
    return () => clearTimeout(refreshTimeout);
  }, [refreshToken, dispatch]);
};
