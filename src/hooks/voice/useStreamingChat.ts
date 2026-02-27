// src/hooks/voice/useStreamingChat.ts
import { useRef, useCallback, useState } from 'react';

interface UseStreamingChatOptions {
  apiEndpoint?: string;
  systemPrompt?: string;
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export const useStreamingChat = (options: UseStreamingChatOptions) => {
  const {
    apiEndpoint = '/api/chat',
    systemPrompt = 'You are a helpful assistant.',
    onToken,
    onComplete,
    onError,
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Array<{ role: string; content: string }>>([]);

  const sendMessage = useCallback(
    async function* (message: string): AsyncGenerator<string, void, unknown> {
      setIsGenerating(true);
      abortControllerRef.current = new AbortController();
      messagesRef.current.push({ role: 'user', content: message });

      let fullText = '';

      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        const isLocal = apiEndpoint.startsWith('/');

        const response = await fetch(
          isLocal ? apiEndpoint : 'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(isLocal ? {} : { Authorization: `Bearer ${apiKey}` }),
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                ...messagesRef.current,
              ],
              stream: true,
              max_tokens: 150,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) throw new Error(`Chat failed: ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                const token = parsed.choices?.[0]?.delta?.content || '';
                if (token) {
                  fullText += token;
                  onToken?.(token);
                  yield token;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        messagesRef.current.push({ role: 'assistant', content: fullText });
        onComplete?.(fullText);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onError?.(error as Error);
          throw error;
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [apiEndpoint, systemPrompt, onToken, onComplete, onError]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return { sendMessage, isGenerating, abort };
};