// lib/api.ts — Axios instance with interceptors
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bj_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('bj_token');
      localStorage.removeItem('bj_user');
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── API helpers ────────────────────────────────────────────

export const authAPI = {
  register:        (data: any)           => api.post('/auth/register', data),
  login:           (data: any)           => api.post('/auth/login', data),
  logout:          ()                    => api.post('/auth/logout'),
  me:              ()                    => api.get('/auth/me'),
  updateProfile:   (data: any)           => api.put('/auth/update-profile', data),
  changePassword:  (data: any)           => api.put('/auth/change-password', data),
};

export const productsAPI = {
  getAll:    (params?: any)              => api.get('/products', { params }),
  getById:   (id: number | string)       => api.get(`/products/${id}`),
  create:    (data: any)                 => api.post('/products', data),
  update:    (id: number, data: any)     => api.put(`/products/${id}`, data),
  delete:    (id: number)                => api.delete(`/products/${id}`),
  uploadImages: (id: number, form: FormData) => api.post(`/products/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const cartAPI = {
  get:     ()                            => api.get('/cart'),
  add:     (product_id: number, quantity?: number) => api.post('/cart/add', { product_id, quantity }),
  update:  (id: number, quantity: number) => api.put(`/cart/update/${id}`, { quantity }),
  remove:  (id: number)                  => api.delete(`/cart/remove/${id}`),
  clear:   ()                            => api.delete('/cart/clear'),
};

export const wishlistAPI = {
  get:    ()                             => api.get('/wishlist'),
  add:    (product_id: number)           => api.post('/wishlist/add', { product_id }),
  remove: (productId: number)            => api.delete(`/wishlist/remove/${productId}`),
};

export const ordersAPI = {
  create:       (data: any)               => api.post('/orders', data),
  getMy:        ()                        => api.get('/orders'),
  getById:      (id: string | number)     => api.get(`/orders/${id}`),
  getInvoice:   (id: string | number)     => api.get(`/orders/${id}/invoice`),
  updateStatus: (id: number, data: any)   => api.put(`/orders/${id}/status`, data),
  getAll:       (params?: any)            => api.get('/admin/orders', { params }),
};

export const reviewsAPI = {
  get:  (productId: number | string)    => api.get(`/reviews/${productId}`),
  add:  (productId: number | string, data: any) => api.post(`/reviews/${productId}`, data),
};

export const goldRatesAPI = {
  get:    ()                            => api.get('/gold-rates'),
  update: (data: any)                   => api.put('/gold-rates', data),
};

export const addressesAPI = {
  get:    ()                            => api.get('/addresses'),
  add:    (data: any)                   => api.post('/addresses', data),
  update: (id: number, data: any)       => api.put(`/addresses/${id}`, data),
  delete: (id: number)                  => api.delete(`/addresses/${id}`),
};

export const categoriesAPI = {
  get:    ()                            => api.get('/categories'),
  create: (data: any)                   => api.post('/categories', data),
};

export const adminAPI = {
  stats: ()                             => api.get('/admin/stats'),
  users: ()                             => api.get('/admin/users'),
};

export const couponsAPI = {
  validate: (code: string, order_total: number) => api.post('/coupons/validate', { code, order_total }),
};

// ── Formatting Helpers ─────────────────────────────────────

export const formatPrice = (n: number) =>
  '₹' + Number(n).toLocaleString('en-IN');

export const calcProductPrice = (
  goldWeight: number,
  purity: string,
  makingCharges: number,
  rates: { rate_22k: number; rate_18k: number; rate_14k: number }
): number => {
  const rate = purity === '22k' ? rates.rate_22k : purity === '18k' ? rates.rate_18k : rates.rate_14k;
  return Math.round(goldWeight * rate + makingCharges);
};
