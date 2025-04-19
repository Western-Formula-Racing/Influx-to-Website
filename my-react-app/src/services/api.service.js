const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://3.98.181.12:3000';
// Function to get token directly from localStorage
const getToken = () => localStorage.getItem('authToken');

// Function to create headers with auth token
const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Example of a protected API call
export const loadTrack = async (name) => {
  const response = await fetch(`${API_URL}/track/load/${name}`, {
    headers: authHeaders(),
  });
  
  return response.json();
};

export const saveTrack = async (name, points) => {
  const response = await fetch(`${API_URL}/track/save`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, points }),
  });
  
  return response.json();
};

// More general fetch function with authentication
export const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    ...options.headers,
    ...authHeaders(),
  };
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
  
  return response.json();
};

// Example using the more general fetch function
export const getData = (endpoint) => {
  return fetchWithAuth(`/${endpoint}`);
};

export const postData = (endpoint, data) => {
  return fetchWithAuth(`/${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};