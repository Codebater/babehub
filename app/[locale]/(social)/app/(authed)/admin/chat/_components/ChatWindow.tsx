'use client';

import { useRef, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { adminSendMessage, userSendMessage } from '../actions';

type Message = {
  id: string;
  body: string;
  is_from_admin: boolean;
  created_at: string;
  sender_handle: string;
};

interface ChatWindowProps {
  threadId: string;
  messages: Message[];
  isAdmin: boolean;
  /** Current user's handle — used to label own messages */
  myHandle: string;
  /** Remaining messages quota (user-side only) */
  rateRemaining?: number;
  rateLimit?: number;
}

const MAX_CHARS = 2000;

export default function ChatWindow({
  threadId,
  messages,
  isAdmin,
  myHandle,
  rateRemaining,
  rateLimit = 10,
}: ChatWindowProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(rateRemaining ?? rateLimit);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on load and on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 6 s
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 6000);
    return () => clearInterval(id);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || isPending) return;
    setError('');

    startTransition(async () => {
      const result = isAdmin
        ? await adminSendMessage(threadId, text)
        : await userSendMessage(threadId, text);

      if (!result.ok) {
        setError(result.error ?? 'Failed to send message.');
      } else {
        setBody('');
        if (!isAdmin && result.remaining !== undefined) {
          setRemaining(result.remaining);
        }
        router.refresh();
        textareaRef.current?.focus();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isRateLimited = !isAdmin && remaining <= 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center py-16">
            <p className="text-sm text-text-secondary">
              No messages yet. Start the conversation below.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const mine = isAdmin ? msg.is_from_admin : !msg.is_from_admin;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  mine
                    ? 'rounded-br-sm bg-primary text-white'
                    : 'rounded-bl-sm bg-secondary text-text-main border border-border-color'
                }`}
              >
                {msg.body}
              </div>
              <span className="px-1 text-[10px] text-text-secondary/60">
                {msg.is_from_admin ? 'BabeHub Team' : `@${msg.sender_handle}`}
                {' · '}
                {formatTime(msg.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Rate limit bar (user only) */}
      {!isAdmin && (
        <div className="border-t border-border-color/40 bg-secondary/30 px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] text-text-secondary/70">
            Beta · {remaining} of {rateLimit} messages remaining today
          </span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-border-color">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(0, (remaining / rateLimit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border-color bg-card px-4 py-3 flex gap-3 items-end"
      >
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            disabled={isPending || isRateLimited}
            rows={2}
            placeholder={
              isRateLimited
                ? 'Daily message limit reached — check back tomorrow.'
                : 'Type a message… (Enter to send, Shift+Enter for new line)'
            }
            className="w-full resize-none rounded-xl border border-border-color bg-secondary px-3 py-2 text-sm text-text-main placeholder-text-secondary/50 focus:border-primary/60 focus:outline-none disabled:opacity-50"
          />
          {error && (
            <p className="mt-1 text-xs text-red-400">{error}</p>
          )}
          {body.length > MAX_CHARS * 0.8 && (
            <p className="mt-0.5 text-right text-[10px] text-text-secondary/60">
              {body.length}/{MAX_CHARS}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending || !body.trim() || isRateLimited}
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-all hover:bg-pink-400 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
