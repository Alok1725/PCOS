import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.error || `HTTP ${res.status}: ${res.statusText}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  async get(path) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    });
    return handleResponse(res);
  },

  async post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async patch(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async put(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async delete(path) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    });
    return handleResponse(res);
  },

  // For multipart/form-data (file uploads) — don't set Content-Type, browser sets it with boundary
  async upload(path, formData) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: formData,
    });
    return handleResponse(res);
  },
};

