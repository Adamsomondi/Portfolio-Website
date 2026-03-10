// src/lib/api.js
const BASE = import.meta.env.VITE_API_URL || '/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  getProjects:         () => get('/projects'),
  getFeaturedProjects: () => get('/projects/featured'),
  getProject:       (id) => get(`/projects/${id}`),
  getBlogPosts:        () => get('/blog'),
  getBlogPost:      (id) => get(`/blog/${id}`),
  getProfile:          () => get('/profile'),
  sendContact:    (data) => post('/contact', data),
};