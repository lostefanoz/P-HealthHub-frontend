const defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
export const API_URL = import.meta.env.VITE_API_URL || `http://${defaultHost}:8000/api/v1`;
