import { REACT_APP_VIDEOSDK_TOKEN, REACT_APP_AUTH_URL } from "@env";

const API_BASE_URL = "https://api.videosdk.live/v2";

const VIDEOSDK_TOKEN = REACT_APP_VIDEOSDK_TOKEN;
const API_AUTH_URL = REACT_APP_AUTH_URL;

export const getToken = async () => {
  console.log('🔵 getToken: Starting token retrieval...');
  console.log('📌 VIDEOSDK_TOKEN:', VIDEOSDK_TOKEN ? '✅ SET (hardcoded)' : '❌ NOT SET');
  console.log('📌 API_AUTH_URL:', API_AUTH_URL ? `✅ SET (${API_AUTH_URL})` : '❌ NOT SET');

  if (VIDEOSDK_TOKEN && API_AUTH_URL) {
    const error = 'Error: Provide only ONE PARAMETER - either Token or Auth API';
    console.error('🔴 ' + error);
    throw new Error(error);
  } else if (VIDEOSDK_TOKEN) {
    console.log('✅ Using hardcoded VIDEOSDK_TOKEN');
    return VIDEOSDK_TOKEN;
  } else if (API_AUTH_URL) {
    try {
      console.log(`⏳ Fetching token from: ${API_AUTH_URL}/get-token`);
      const res = await fetch(`${API_AUTH_URL}/get-token`, {
        method: "GET",
      });

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
      console.error('🔴 Token fetch error:', error.message);
      console.error('💡 Make sure backend server is running on ' + API_AUTH_URL);
      throw error;
    }
  } else {
    const error = 'Please add a token or Auth Server URL in .env';
    console.error('🔴 ' + error);
    throw new Error(error);
  }
};

export const createMeeting = async ({ token }) => {
  console.log('🔵 createMeeting: Creating new meeting...');
  
  if (!token) {
    console.error('🔴 createMeeting: No token provided');
    throw new Error('Token is required to create a meeting');
  }

  const url = `${API_BASE_URL}/rooms`;
  const options = {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
  };

  try {
    console.log('⏳ Sending meeting creation request to VideoSDK API...');
    const response = await fetch(url, options);

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
    console.error('🔴 createMeeting error:', error.message);
    throw error;
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
