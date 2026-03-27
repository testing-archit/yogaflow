const getHeaders = async () => {
  // Use mock local storage token instead of firebase
  let token = '';
  try {
    const userStr = localStorage.getItem('yogaFlowUser');
    if (userStr) token = JSON.parse(userStr).email; // simple mock token
  } catch (e) {}

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiClient = {
  get: async (table: string, id?: string, options?: { filters?: any, orderBy?: string, orderDir?: 'asc' | 'desc' }) => {
    let url = `/api/crud?table=${table}`;
    if (id) url += `&id=${id}`;
    if (options?.filters) url += `&filters=${encodeURIComponent(JSON.stringify(options.filters))}`;
    if (options?.orderBy) url += `&orderBy=${options.orderBy}`;
    if (options?.orderDir) url += `&orderDir=${options.orderDir}`;

    const res = await fetch(url, { headers: await getHeaders() });
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
