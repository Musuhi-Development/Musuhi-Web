"use client";

import { useState, useEffect, useCallback } from 'react';
import { Connection, User } from '@prisma/client';

export type ConnectionWithUsers = Connection & {
  initiator: Partial<User>;
  receiver: Partial<User>;
};

export function useConnections() {
  const [connections, setConnections] = useState<ConnectionWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/connections');
      if (!response.ok) {
        throw new Error('つながりの取得に失敗しました。');
      }
      const data = await response.json();
      setConnections(data.connections);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'blocked') => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('リクエストの更新に失敗しました。');
      }
      // リストを再読み込みしてUIを更新
      await fetchConnections();
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('つながりの削除に失敗しました。');
      }
      // リストを再読み込みしてUIを更新
      await fetchConnections();
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    }
  };

  return { connections, loading, error, updateConnectionStatus, deleteConnection, refreshConnections: fetchConnections };
}
