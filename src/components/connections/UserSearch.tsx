"use client";

import { useState, useCallback, useEffect } from 'react';
import { User } from '@prisma/client';
import { Search, X, UserPlus, Check, Clock } from 'lucide-react';
import { useDebounce } from 'use-debounce';

type SearchResultUser = Partial<User>;

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<Record<string, 'pending' | 'sent' | 'error'>>({});

  const [debouncedQuery] = useDebounce(query, 500);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('ユーザーの検索に失敗しました。');
      }
      const data = await response.json();
      setResults(data.users);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchUsers(debouncedQuery);
  }, [debouncedQuery, searchUsers]);

  const sendConnectionRequest = async (receiverId: string) => {
    setRequestStatus(prev => ({ ...prev, [receiverId]: 'pending' }));
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId }),
      });
      if (!response.ok) {
        throw new Error('リクエストの送信に失敗しました。');
      }
      setRequestStatus(prev => ({ ...prev, [receiverId]: 'sent' }));
    } catch (e) {
      setRequestStatus(prev => ({ ...prev, [receiverId]: 'error' }));
      console.error(e);
    }
  };

  return (
    <div className="my-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">新しいつながりを探す</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前や表示名で検索..."
          className="w-full bg-white border border-gray-200 rounded-full py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        )}
      </div>

      {loading && <div className="text-center py-4 text-gray-500">検索中...</div>}
      {error && <div className="text-center py-4 text-red-500">{error}</div>}
      
      <div className="mt-4 space-y-2">
        {results.map(user => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full">
                {user.avatarUrl && <img src={user.avatarUrl} alt={user.displayName || ''} className="w-full h-full rounded-full object-cover" />}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">{user.displayName || user.name}</p>
                <p className="text-xs text-gray-500">@{user.name}</p>
              </div>
            </div>
            <button
              onClick={() => sendConnectionRequest(user.id!)}
              disabled={requestStatus[user.id!] === 'pending' || requestStatus[user.id!] === 'sent'}
              className="p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestStatus[user.id!] === 'sent' ? (
                <Check size={20} className="text-green-500" />
              ) : requestStatus[user.id!] === 'pending' ? (
                <Clock size={20} className="text-gray-400 animate-spin" />
              ) : requestStatus[user.id!] === 'error' ? (
                 <X size={20} className="text-red-500" />
              ) : (
                <UserPlus size={20} className="text-blue-500 hover:text-blue-700" />
              )}
            </button>
          </div>
        ))}
        {debouncedQuery && !loading && results.length === 0 && (
          <div className="text-center py-4 text-gray-400">該当するユーザーが見つかりません。</div>
        )}
      </div>
    </div>
  );
}
