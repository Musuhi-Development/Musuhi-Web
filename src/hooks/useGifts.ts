"use client";

import { useEffect, useState } from "react";

export function useGifts(type?: "sent" | "received") {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGifts() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (type) params.append("type", type);

        const response = await fetch(`/api/gifts?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch gifts");
        }

        const data = await response.json();
        setGifts(data.gifts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGifts();
  }, [type]);

  return { gifts, loading, error };
}

export function useYosegaki(type?: "created" | "contributed") {
  const [yosegakiList, setYosegakiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchYosegaki() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (type) params.append("type", type);

        const response = await fetch(`/api/yosegaki?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch yosegaki");
        }

        const data = await response.json();
        setYosegakiList(data.yosegakiList);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchYosegaki();
  }, [type]);

  return { yosegakiList, loading, error };
}
