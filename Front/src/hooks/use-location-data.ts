import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CountryOption,
  fetchCountries,
  fetchCountryDepartments,
  searchAddressSuggestions,
} from '@/lib/location-api';

interface UseLocationDataParams {
  country: string;
  addressDebounceMs?: number;
  minAddressQueryLength?: number;
}

function useLocationData({
  country,
  addressDebounceMs = 350,
  minAddressQueryLength = 3,
}: UseLocationDataParams) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressAbortRef = useRef<AbortController | null>(null);

  const countryCodeMap = useMemo(
    () =>
      new Map(
        countries.map((countryOption) => [
          countryOption.name,
          countryOption.code,
        ]),
      ),
    [countries],
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadCountries = async () => {
      setIsCountriesLoading(true);

      try {
        const nextCountries = await fetchCountries(controller.signal);
        setCountries(nextCountries);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setCountries([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCountriesLoading(false);
        }
      }
    };

    void loadCountries();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!country.trim()) {
      setDepartments([]);
      return;
    }

    const controller = new AbortController();

    const loadDepartments = async () => {
      setIsDepartmentsLoading(true);

      try {
        const nextDepartments = await fetchCountryDepartments(
          country,
          controller.signal,
        );
        setDepartments(nextDepartments);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setDepartments([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsDepartmentsLoading(false);
        }
      }
    };

    void loadDepartments();

    return () => {
      controller.abort();
    };
  }, [country]);

  useEffect(() => {
    return () => {
      if (addressDebounceRef.current) {
        clearTimeout(addressDebounceRef.current);
      }
      addressAbortRef.current?.abort();
    };
  }, []);

  const hideAddressSuggestions = () => {
    setShowAddressSuggestions(false);
  };

  const resetAddressSuggestions = () => {
    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current);
    }
    addressAbortRef.current?.abort();
    setIsAddressLoading(false);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const runAddressSearch = async (query: string) => {
    addressAbortRef.current?.abort();
    const controller = new AbortController();
    addressAbortRef.current = controller;
    setIsAddressLoading(true);

    try {
      const countryCode = countryCodeMap.get(country);
      const suggestions = await searchAddressSuggestions({
        query,
        countryCode,
        signal: controller.signal,
      });

      setAddressSuggestions(suggestions);
      setShowAddressSuggestions(suggestions.length > 0);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsAddressLoading(false);
      }
    }
  };

  const requestAddressSuggestions = (query: string) => {
    const trimmedQuery = query.trim();

    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current);
    }

    if (trimmedQuery.length < minAddressQueryLength) {
      resetAddressSuggestions();
      return;
    }

    addressDebounceRef.current = setTimeout(() => {
      void runAddressSearch(trimmedQuery);
    }, addressDebounceMs);
  };

  return {
    countries,
    departments,
    isCountriesLoading,
    isDepartmentsLoading,
    isAddressLoading,
    addressSuggestions,
    showAddressSuggestions,
    requestAddressSuggestions,
    hideAddressSuggestions,
    resetAddressSuggestions,
  };
}

export { useLocationData };
