"use client";

import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/users/me");
        
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated
            setUser(null);
            return;
          }
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading, error };
}

export function useConnections(status?: "pending" | "accepted" | "blocked") {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConnections() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (status) params.append("status", status);

        const response = await fetch(`/api/connections?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch connections");
        }

        const data = await response.json();
        setConnections(data.connections);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchConnections();
  }, [status]);

  return { connections, loading, error };
}
