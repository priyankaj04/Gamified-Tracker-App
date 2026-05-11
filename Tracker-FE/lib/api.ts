import axios from 'axios';
import { API_BASE_URL } from '@/constants';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const serverError = err?.response?.data?.error;
    const url = `${err?.config?.baseURL ?? ''}${err?.config?.url ?? ''}`;
    if (serverError) {
      return Promise.reject(new Error(serverError));
    }
    if (err?.code === 'ECONNABORTED') {
      return Promise.reject(new Error(`API timeout at ${url}`));
    }
    if (err?.message === 'Network Error') {
      return Promise.reject(
        new Error(`Cannot reach API at ${API_BASE_URL}. Is the backend running?`),
      );
    }
    return Promise.reject(new Error(err?.message ?? 'Unknown error'));
  },
);

if (__DEV__) {
  // helpful one-time log so you can confirm the resolved URL
  console.log(`[api] base URL → ${API_BASE_URL}`);
}

export const unwrap = <T>(res: { data: { data: T } }) => res.data.data;
