export interface CountryOption {
  name: string;
  code: string;
}

interface CountryApiItem {
  name?: {
    common?: string;
  };
  cca2?: string;
}

interface DepartmentsApiResponse {
  data?: {
    states?: Array<{
      name?: string;
    }>;
  };
}

interface AddressApiItem {
  display_name?: string;
}

const COUNTRIES_ENDPOINT =
  'https://restcountries.com/v3.1/all?fields=name,cca2';
const DEPARTMENTS_ENDPOINT =
  'https://countriesnow.space/api/v0.1/countries/states';
const ADDRESS_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

export async function fetchCountries(
  signal?: AbortSignal,
): Promise<CountryOption[]> {
  const response = await fetch(COUNTRIES_ENDPOINT, { signal });
  if (!response.ok) {
    throw new Error('Failed to load countries');
  }

  const payload = (await response.json()) as CountryApiItem[];
  const uniqueCountries = new Map<string, CountryOption>();

  payload.forEach((item) => {
    const name = item?.name?.common?.trim();
    const code = item?.cca2?.trim().toLowerCase();

    if (name && code) {
      uniqueCountries.set(name, { name, code });
    }
  });

  return Array.from(uniqueCountries.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export async function fetchCountryDepartments(
  country: string,
  signal?: AbortSignal,
): Promise<string[]> {
  if (!country.trim()) {
    return [];
  }

  const response = await fetch(DEPARTMENTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ country }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to load departments');
  }

  const payload = (await response.json()) as DepartmentsApiResponse;
  return (payload.data?.states ?? [])
    .map((state) => state.name?.trim() ?? '')
    .filter(Boolean);
}

interface SearchAddressOptions {
  query: string;
  countryCode?: string;
  signal?: AbortSignal;
  limit?: number;
}

export async function searchAddressSuggestions({
  query,
  countryCode,
  signal,
  limit = 5,
}: SearchAddressOptions): Promise<string[]> {
  if (query.trim().length < 3) {
    return [];
  }

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(limit),
  });

  if (countryCode) {
    params.set('countrycodes', countryCode);
  }

  const response = await fetch(`${ADDRESS_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to load address suggestions');
  }

  const payload = (await response.json()) as AddressApiItem[];
  return Array.from(
    new Set(
      payload.map((item) => item.display_name?.trim() ?? '').filter(Boolean),
    ),
  );
}
