export const API =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`

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

// identifier = email ya phone number
export const api = {
  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (identifier, password) =>
    request('/api/auth/login', { method: 'POST', body: { identifier, password } }),
  otpLogin: (identifier) =>
    request('/api/auth/otp-login', { method: 'POST', body: { identifier } }),
  verifyOtp: (identifier, otp) =>
    request('/api/auth/verify-otp', { method: 'POST', body: { identifier, otp } }),
  resendOtp: (identifier) =>
    request('/api/auth/resend-otp', { method: 'POST', body: { identifier } }),
  forgotPassword: (identifier) =>
    request('/api/auth/forgot-password', { method: 'POST', body: { identifier } }),
  resetPassword: (identifier, otp, password) =>
    request('/api/auth/reset-password', {
      method: 'POST',
      body: { identifier, otp, password },
    }),
  me: () => request('/api/auth/me'),

  users: (search = '') => request(`/api/users?search=${encodeURIComponent(search)}`),
  updateName: (name) => request('/api/users/me', { method: 'PUT', body: { name } }),
  addPhone: (phone) => request('/api/users/me/phone', { method: 'POST', body: { phone } }),
  verifyPhone: (otp) =>
    request('/api/users/me/phone/verify', { method: 'POST', body: { otp } }),
  removePhone: () => request('/api/users/me/phone', { method: 'DELETE' }),
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