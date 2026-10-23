import { io } from 'socket.io-client'
import { API, getToken } from './api'

let socket = null

// Login ke baad call karna (token tab tak save ho chuka hota hai)
export function connectSocket() {
  if (!socket) socket = io(API, { auth: { token: getToken() } })
  return socket
}

// Logout par call karna
export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}