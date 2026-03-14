"use client";

import { useEffect, useState } from "react";

export function useBoards(isPublic?: boolean) {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBoards() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (isPublic !== undefined) params.append("public", String(isPublic));

        const response = await fetch(`/api/board?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch boards");
        }

        const data = await response.json();
        setBoards(data.boards);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBoards();
  }, [isPublic]);

  const refresh = () => {
    setLoading(true);
    fetchBoards();
  };

  async function fetchBoards() {
    try {
      const params = new URLSearchParams();
      if (isPublic !== undefined) params.append("public", String(isPublic));

      const response = await fetch(`/api/board?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch boards");
      }

      const data = await response.json();
      setBoards(data.boards);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { boards, loading, error, refresh };
}

export function useBoard(id: string | null) {
  const [board, setBoard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchBoard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/board/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch board");
        }

        const data = await response.json();
        setBoard(data.board);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBoard();
  }, [id]);

  return { board, loading, error };
}
