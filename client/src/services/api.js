const API_BASE = '/api';

export async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const storedToken = token || localStorage.getItem('stocksense_token');
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const options = {
    method,
    headers
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || `HTTP ${response.status} Error`);
    }

    return json;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    throw err;
  }
}
