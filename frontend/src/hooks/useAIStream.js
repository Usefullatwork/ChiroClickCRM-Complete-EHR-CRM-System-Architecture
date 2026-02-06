/**
 * AI Streaming Hook
 * Handles SSE (Server-Sent Events) streaming from Ollama via backend
 * Real-time token-by-token display for AI completions
 */

import { useState, useCallback, useRef } from 'react';

const API_BASE = '/api/v1';

export const useAIStream = () => {
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const startStream = useCallback(async (endpoint, body = {}) => {
    setStreaming(true);
    setText('');
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                setText(prev => prev + data.text);
              }
              if (data.done) {
                setStreaming(false);
                return;
              }
              if (data.error) {
                setError(data.error);
                setStreaming(false);
                return;
              }
            } catch (e) {
              // Skip unparseable SSE data
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setText('');
    setError(null);
  }, [stopStream]);

  return { streaming, text, error, startStream, stopStream, reset };
};

export default useAIStream;
