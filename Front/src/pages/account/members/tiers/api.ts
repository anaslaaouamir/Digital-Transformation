import type { ITiers, ITiersResponse, ITiersApiParams } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function getAuthToken(): string {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    ''
  );
}

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function fetchTiers(params?: ITiersApiParams): Promise<ITiersResponse> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.append('page', String(params.page));
  if (params?.limit !== undefined) q.append('limit', String(params.limit));
  if (params?.search) {
    q.append('search', params.search);
    // Add common aliases for better backend compatibility
    q.append('q', params.search);
    q.append('searchTerm', params.search);
  }
  // Send boolean filters only when true; include snake_case aliases
  if (params?.estClient === true) {
    q.append('estClient', 'true');
    q.append('est_client', 'true');
  }
  if (params?.estFournisseur === true) {
    q.append('estFournisseur', 'true');
    q.append('est_fournisseur', 'true');
  }
  if (params?.estProspect === true) {
    q.append('estProspect', 'true');
    q.append('est_prospect', 'true');
  }
  if (params?.etat) q.append('etat', params.etat);
  if (params?.sortBy) q.append('sortBy', params.sortBy);
  if (params?.sortOrder) q.append('sortOrder', params.sortOrder);

  const url = `${API_BASE_URL}/tiers${q.toString() ? '?' + q.toString() : ''}`;
  console.debug('[fetchTiers] GET', url);

  const res = await fetch(url, { method: 'GET', headers: getHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(`Failed to fetch tiers [HTTP ${res.status}]: ${body}`);
  }

  const json = await res.json();
  if (Array.isArray(json)) {
    return { data: json, total: json.length, page: params?.page ?? 1, limit: params?.limit ?? json.length };
  }
  return {
    data: json.data ?? json.items ?? json.results ?? [],
    total: json.total ?? json.count ?? json.totalCount ?? 0,
    page: json.page ?? params?.page ?? 1,
    limit: json.limit ?? json.pageSize ?? params?.limit ?? 10,
  };
}

export async function fetchTierById(id: number): Promise<ITiers> {
  const res = await fetch(`${API_BASE_URL}/tiers/${id}`, { method: 'GET', headers: getHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(`Failed to fetch tier [HTTP ${res.status}]: ${body}`);
  }
  return res.json();
}

export async function createTier(tierData: Partial<ITiers>): Promise<ITiers> {
  const res = await fetch(`${API_BASE_URL}/tiers`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(tierData),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(`Failed to create tier [HTTP ${res.status}]: ${body}`);
  }
  return res.json();
}

export async function updateTier(id: number, tierData: Partial<ITiers>): Promise<ITiers> {
  const res = await fetch(`${API_BASE_URL}/tiers/${id}`, {
    method: 'PUT', headers: getHeaders(), body: JSON.stringify(tierData),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(`Failed to update tier [HTTP ${res.status}]: ${body}`);
  }
  return res.json();
}

export async function deleteTier(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/tiers/${id}`, {
    method: 'DELETE', headers: getHeaders(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(`Failed to delete tier [HTTP ${res.status}]: ${body}`);
  }
}
