// Accepts VITE_API_URL with or without the trailing /api (e.g. http://localhost:5000 or http://localhost:5000/api)
const RAW = ((import.meta.env.VITE_API_URL as string | undefined) || '').trim().replace(/\/+$/, '')
const BASE = RAW ? (RAW.endsWith('/api') ? RAW : `${RAW}/api`) : '/api'
const TOKEN_KEY = 'fmx_admin_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// called when the server says our token is no longer valid
let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn)

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && path !== '/admin/login') onUnauthorized()
  if (!res.ok) throw new ApiError(data?.message || 'Request failed', res.status)
  return data as T
}

const body = (method: string, data?: unknown): RequestInit => ({ method, body: data === undefined ? undefined : JSON.stringify(data) })

/* ---------- Types ---------- */
export type Img = { url: string; publicId: string }
export type Product = {
  id: string
  slug: string
  name: string
  desc: string
  longDesc: string
  price: number
  category: string
  image: Img
  hoverImage: Img
  stock: number
  isActive: boolean
  sortOrder: number
}
export type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'submitted' | 'paid' | 'failed'
export type Order = {
  _id: string
  orderNumber: string
  items: { name: string; price: number; qty: number; img?: string }[]
  customer: { name: string; email: string; phone: string }
  shippingAddress: { line1: string; line2?: string; city: string; state: string; pincode: string }
  notes?: string
  subtotal: number
  shipping: number
  total: number
  payment: {
    method: string
    status: PaymentStatus
    upiId?: string
    utr?: string
    screenshot?: { url?: string }
    submittedAt?: string
    paidAt?: string
    adminNote?: string
  }
  orderStatus: OrderStatus
  trackingNumber?: string
  createdAt: string
}
export type Message = { _id: string; name: string; email: string; phone?: string; orderNumber?: string; topic?: string; message: string; isRead: boolean; createdAt: string }
export type CustomerRow = {
  id: string
  name: string
  email: string
  phone: string
  address: { line1: string; line2: string; city: string; state: string; pincode: string }
  createdAt: string
  orders: number
  spent: number
}
export type Subscriber = { _id: string; email: string; createdAt: string }
export type Settings = {
  storeName: string
  contactEmail: string
  contactPhone: string
  shippingFee: number
  freeShippingAbove: number
  upi: { enabled: boolean; upiId: string; payeeName: string; instructions: string }
}
export type Dashboard = {
  totals: { orders: number; revenue: number; paidOrders: number; pendingVerification: number; products: number; unreadMessages: number; subscribers: number }
  lowStock: { _id: string; name: string; stock: number }[]
  recentOrders: { _id: string; orderNumber: string; customer: { name: string }; total: number; orderStatus: OrderStatus; payment: { status: PaymentStatus }; createdAt: string }[]
  daily: { date: string; revenue: number; orders: number }[]
}

/* ---------- Endpoints ---------- */
export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; admin: { name: string; email: string } }>('/admin/login', body('POST', { email, password })),
  me: () => request<{ name: string; email: string }>('/admin/me'),
  changePassword: (currentPassword: string, newPassword: string) => request('/admin/password', body('PUT', { currentPassword, newPassword })),
  dashboard: () => request<Dashboard>('/admin/dashboard'),

  products: () => request<Product[]>('/admin/products'),
  createProduct: (p: Partial<Product>) => request<Product>('/admin/products', body('POST', p)),
  updateProduct: (id: string, p: Partial<Product>) => request<Product>(`/admin/products/${id}`, body('PUT', p)),
  deleteProduct: (id: string) => request(`/admin/products/${id}`, body('DELETE')),
  uploadImage: (file: File) => {
    const f = new FormData()
    f.append('image', file)
    return request<Img>('/admin/upload', { method: 'POST', body: f })
  },
  deleteImage: (publicId: string) => request('/admin/upload', body('DELETE', { publicId })),

  orders: (params: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)]))
    return request<{ orders: Order[]; total: number; page: number; pages: number }>(`/admin/orders?${q}`)
  },
  setOrderStatus: (id: string, data: { orderStatus?: OrderStatus; trackingNumber?: string }) => request<Order>(`/admin/orders/${id}/status`, body('PATCH', data)),
  setPaymentStatus: (id: string, status: PaymentStatus, adminNote?: string) => request<Order>(`/admin/orders/${id}/payment`, body('PATCH', { status, adminNote })),

  customers: (params: { q?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)]))
    return request<{ customers: CustomerRow[]; total: number; page: number; pages: number }>(`/admin/customers?${q}`)
  },

  messages: () => request<Message[]>('/admin/messages'),
  markMessage: (id: string, isRead: boolean) => request<Message>(`/admin/messages/${id}`, body('PATCH', { isRead })),
  deleteMessage: (id: string) => request(`/admin/messages/${id}`, body('DELETE')),

  subscribers: () => request<Subscriber[]>('/admin/subscribers'),
  deleteSubscriber: (id: string) => request(`/admin/subscribers/${id}`, body('DELETE')),

  settings: () => request<Settings>('/admin/settings'),
  saveSettings: (s: Partial<Settings>) => request<Settings>('/admin/settings', body('PUT', s)),
}