"use client";
// Hook de leitura da API: busca um endpoint GET e expõe { data, loading, error, reload }.
// Passe path = null para não buscar (ex.: ainda sem id). reload() força nova busca.
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useApi<T>(path: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path != null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (path == null) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    apiGet<T>(path)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Falha ao carregar.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, nonce]);

  return { data, loading, error, reload };
}
