const API_URL = 'http://localhost:9090';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erro ${res.status}`);
  }

  return res.json();
}

// Endpoints
export const api = {
  login:    (email, password)           => request('/auth/login',    'POST', { email, password }),
  register: (nickName, email, password) => request('/auth/register', 'POST', { nickName, email, password }),
};