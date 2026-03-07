"use client";

import { useEffect, useState } from "react";

export function useRecordings(filters?: {
  visibility?: string;
  emotion?: string;
  search?: string;
}) {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecordings() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters?.visibility) params.append("visibility", filters.visibility);
        if (filters?.emotion) params.append("emotion", filters.emotion);
        if (filters?.search) params.append("search", filters.search);

        const response = await fetch(`/api/recordings?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch recordings");
        }

        const data = await response.json();
        setRecordings(data.recordings);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecordings();
  }, [filters?.visibility, filters?.emotion, filters?.search]);

  return { recordings, loading, error };
}

export function useRecording(id: string | null) {
  const [recording, setRecording] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchRecording() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/recordings/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch recording");
        }

        const data = await response.json();
        setRecording(data.recording);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecording();
  }, [id]);

  return { recording, loading, error };
}
