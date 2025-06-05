import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

interface DecodedToken {
  user_id: number;
  exp: number;
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

export const refreshToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await axios.post(`${BACKEND_URL}/api/refresh-token`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const newToken = response.data.token;
    localStorage.setItem('token', newToken);
    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('token');
    return null;
  }
};

export const setupTokenRefresh = (): void => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return;

  // Refresh token 5 minutes before expiration
  const refreshTime = expirationTime - 5 * 60 * 1000;
  const timeUntilRefresh = refreshTime - Date.now();

  if (timeUntilRefresh > 0) {
    setTimeout(async () => {
      const newToken = await refreshToken();
      if (newToken) {
        setupTokenRefresh(); // Setup next refresh
      }
    }, timeUntilRefresh);
  } else {
    // Token is already expired or about to expire, refresh immediately
    refreshToken();
  }
}; 