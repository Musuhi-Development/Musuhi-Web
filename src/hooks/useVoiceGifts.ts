"use client";

import { useEffect, useState, useCallback } from "react";

export type VoiceGiftFilter = "all" | "sent" | "received" | "draft" | "scheduled";

export function useVoiceGifts(filter: VoiceGiftFilter) {
  const [voiceGifts, setVoiceGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoiceGifts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/voice-gifts?filter=${filter}`);

      if (!response.ok) {
        throw new Error("Failed to fetch voice gifts");
      }

      const data = await response.json();
      setVoiceGifts(data.voiceGifts || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch voice gifts");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchVoiceGifts();
  }, [fetchVoiceGifts]);

  return { voiceGifts, loading, error, refresh: fetchVoiceGifts };
}
