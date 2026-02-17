import { REACT_APP_VIDEOSDK_TOKEN, REACT_APP_AUTH_URL } from "@env";

const API_BASE_URL = "https://api.videosdk.live/v2";

const VIDEOSDK_TOKEN = REACT_APP_VIDEOSDK_TOKEN;
const API_AUTH_URL = REACT_APP_AUTH_URL || "http://192.168.1.12:3000";
export const API_URL = API_AUTH_URL;

const TOKEN_FETCH_TIMEOUT_MS = 15000;

export const getToken = async () => {
  console.log('🔵 getToken: Starting token retrieval...');
  console.log('📌 VIDEOSDK_TOKEN:', VIDEOSDK_TOKEN ? '✅ SET (hardcoded)' : '❌ NOT SET');
  console.log('📌 API_AUTH_URL:', API_AUTH_URL ? `✅ SET (${API_AUTH_URL})` : '❌ NOT SET');

  if (VIDEOSDK_TOKEN && REACT_APP_AUTH_URL) {
    const error = 'Error: Provide only ONE PARAMETER - either Token or Auth API';
    console.error('🔴 ' + error);
    throw new Error(error);
  } else if (VIDEOSDK_TOKEN) {
    console.log('✅ Using hardcoded VIDEOSDK_TOKEN');
    return VIDEOSDK_TOKEN;
  } else {
    const baseUrl = (API_AUTH_URL || '').replace(/\/$/, '');
    const url = `${baseUrl}/get-token`;
    try {
      console.log(`⏳ Fetching token from: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TOKEN_FETCH_TIMEOUT_MS);
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
        console.error('🔴 Token fetch failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const data = await res.json();
      console.log('✅ Token received from backend');

      if (!data.token) {
        console.error('🔴 Token response missing "token" field:', data);
        throw new Error('Invalid token response from server');
      }

      return data.token;
    } catch (error) {
      const isNetworkError = error.message === 'Network request failed' || error.name === 'AbortError';
      const message = isNetworkError
        ? 'Error starting meeting. Make sure: 1) Backend is running (npm start in backend folder). 2) IP is the same for both frontend and backend — in .env set REACT_APP_AUTH_URL to your PC IP (e.g. http://192.168.1.12:3000). 3) If using USB, connect phone to same WiFi as PC, or run: adb reverse tcp:3000 tcp:3000 and use localhost in .env.'
        : (error.message || 'Failed to get token');
      console.error('🔴 Token fetch error:', message);
      throw new Error(message);
    }
  }
};

const FETCH_TIMEOUT_MS = 20000;

export const createMeeting = async ({ token }) => {
  console.log('🔵 createMeeting: Creating new meeting...');

  if (!token) {
    console.error('🔴 createMeeting: No token provided');
    throw new Error('Token is required to create a meeting');
  }

  const url = `${API_BASE_URL}/rooms`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const options = {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    signal: controller.signal,
  };

  try {
    console.log('⏳ Sending meeting creation request to VideoSDK API...');
    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      console.error('🔴 Meeting creation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (!data.roomId) {
      console.error('🔴 Invalid response - no roomId:', data);
      throw new Error('Invalid meeting response from VideoSDK');
    }

    console.log('✅ Meeting created successfully:', data.roomId);
    return data.roomId;
  } catch (error) {
    clearTimeout(timeoutId);
    const isNetworkError = error.message === 'Network request failed' || error.name === 'AbortError';
    const message = isNetworkError
      ? 'Cannot reach the video service. Check your internet connection and try again.'
      : (error.message || 'Failed to create meeting');
    console.error('🔴 createMeeting error:', message);
    throw new Error(message);
  }
};

export const validateMeeting = async ({ meetingId, token }) => {
  const url = `${API_BASE_URL}/rooms/validate/${meetingId}`;

  const options = {
    method: "GET",
    headers: { Authorization: token },
  };

  const result = await fetch(url, options)
    .then((response) => response.json()) //result will have meeting id
    .catch((error) => console.error("error", error));

  return result ? result.roomId === meetingId : false;
};

export const fetchSession = async ({ meetingId, token }) => {
  const url = `${API_BASE_URL}/sessions?roomId=${meetingId}`;

  const options = {
    method: "GET",
    headers: { Authorization: token },
  };

  const result = await fetch(url, options)
    .then((response) => response.json()) //result will have meeting id
    .catch((error) => console.error("error", error));
  return result ? result.data[0] : null;
};
