const baseUrl = process.env.MYTRIP_API_URL || 'http://localhost:8082';
const email = process.env.MYTRIP_TEST_EMAIL || 'user@example.com';
const password = process.env.MYTRIP_TEST_PASSWORD || 'password123';

async function request(path, { expectedStatus = 200, ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const raw = await response.text();
  let body;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  if (response.status !== expectedStatus) {
    throw new Error(`${options.method || 'GET'} ${path} expected ${expectedStatus}, received ${response.status}: ${raw}`);
  }
  return body;
}

async function login(userEmail = email, userPassword = password) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: userPassword })
  });
  return result.token;
}

async function registerTestUser() {
  const result = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `mytrip-e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: 'test-password-123',
      firstName: 'Journey',
      lastName: 'Test'
    })
  });
  return result.token;
}

function jsonHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

module.exports = { baseUrl, request, login, registerTestUser, jsonHeaders };
