export const API = `http://${window.location.hostname}:5000`

export const getToken = () => localStorage.getItem('token')

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(API + path, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

export const api = {
  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),
  verifyOtp: (email, otp) =>
    request('/api/auth/verify-otp', { method: 'POST', body: { email, otp } }),
  resendOtp: (email) =>
    request('/api/auth/resend-otp', { method: 'POST', body: { email } }),
  me: () => request('/api/auth/me'),

  users: (search = '') => request(`/api/users?search=${encodeURIComponent(search)}`),
  updateName: (name) => request('/api/users/me', { method: 'PUT', body: { name } }),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return request('/api/users/me/avatar', { method: 'POST', form })
  },
  removeAvatar: () => request('/api/users/me/avatar', { method: 'DELETE' }),

  messages: (userId) => request(`/api/messages/${userId}`),
}

// "/uploads/x.png" -> "http://localhost:5000/uploads/x.png"
export const fileUrl = (path) => (path ? API + path : '')