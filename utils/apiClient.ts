import { supabase } from './supabase';

// Gets the current Supabase session token — replaces the old Clerk window token approach
const getToken = async (): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? '';
  } catch {
    return '';
  }
};

const getHeaders = async (isPublic = false): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isPublic) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Public tables that don't require auth for reads
const PUBLIC_TABLES = ['asanas', 'instructors', 'yoga_classes', 'research_topics', 'app_settings'];

export const apiClient = {
  get: async (table: string, id?: string, options?: { filters?: any; orderBy?: string; orderDir?: 'asc' | 'desc' }) => {
    let url = `/api/crud?table=${table}`;
    if (id) url += `&id=${id}`;
    if (options?.filters) url += `&filters=${encodeURIComponent(JSON.stringify(options.filters))}`;
    if (options?.orderBy) url += `&orderBy=${options.orderBy}`;
    if (options?.orderDir) url += `&orderDir=${options.orderDir}`;

    const isPublic = PUBLIC_TABLES.includes(table);
    const res = await fetch(url, { headers: await getHeaders(isPublic) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  post: async (table: string, data: any) => {
    const res = await fetch(`/api/crud?table=${table}`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  put: async (table: string, id: string, data: any) => {
    const res = await fetch(`/api/crud?table=${table}&id=${id}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  delete: async (table: string, id: string) => {
    const res = await fetch(`/api/crud?table=${table}&id=${id}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },
};
