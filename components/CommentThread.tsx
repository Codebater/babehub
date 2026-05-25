'use client';

import { useState, useTransition } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { postComment, deleteComment } from '@/lib/interactions/actions';
import type { CommentRow, ContentProvider } from '@/lib/interactions/types';

/**
 * Flat (no threading) comment list + composer for a single video.
 *
 * Server-renders the initial list (`initialComments`), then the
 * composer + delete buttons run client-side. New comments are
 * appended optimistically and reconciled with the server's
 * authoritative row.
 *
 * Comments come from `lib/interactions/load.ts` which fetches
 * profiles in a follow-up batched query because the video_comments
 * FK points to auth.users, not profiles.
 */
type Props = {
  provider: ContentProvider;
  contentId: string;
  initialComments: CommentRow[];
  /** Current viewer id, used to show the delete button on own comments. */
  viewerId: string | null;
  isSignedIn: boolean;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

export default function CommentThread({
  provider,
  contentId,
  initialComments,
  viewerId,
  isSignedIn,
}: Props) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isPending) return;
    const draft = body;
    setBody('');
    setError(null);

    startTransition(async () => {
      const res = await postComment(provider, contentId, draft);
      if (res.ok) {
        setComments((prev) => [
          {
            id: res.data.id,
            body: res.data.body,
            created_at: res.data.created_at,
            user_id: res.data.user_id,
            author: res.data.author,
          },
          ...prev,
        ]);
      } else {
        setError(res.message ?? 'Could not post your comment.');
        setBody(draft);
      }
    });
  };

  const onDelete = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      const res = await deleteComment(id);
      if (!res.ok) {
        // We don't have the original row in scope anymore — just
        // surface an error. Worst case the user reloads.
        setError(res.message ?? 'Could not delete that comment.');
      }
    });
  };

  return (
    <div>
      {/* ── Composer ──────────────────────────────────────────────────── */}
      {isSignedIn ? (
        <form onSubmit={submit} className="mb-4">
          <div className="flex items-start gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
              rows={2}
              maxLength={2000}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-border-color bg-card/60 px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!body.trim() || isPending}
              className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-3.5 w-3.5" />
              Post
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}
        </form>
      ) : (
        <div className="mb-4 rounded-xl border border-dashed border-border-color bg-secondary/40 p-3 text-center text-sm text-text-secondary">
          <Link href="/app/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>{' '}
          to leave a comment.
        </div>
      )}

      {/* ── List ──────────────────────────────────────────────────────── */}
      {comments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-color/60 bg-secondary/30 py-6 text-center text-xs text-text-secondary">
          No comments yet. Be the first.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary">
                {c.author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.author.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-xs font-black text-white">
                    {(c.author?.display_name ?? c.author?.handle ?? '?')
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  {c.author?.handle ? (
                    <Link
                      href={`/c/${c.author.handle}` as '/c/[handle]'}
                      className="text-sm font-bold text-text-main hover:text-primary"
                    >
                      {c.author.display_name || `@${c.author.handle}`}
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-text-secondary">deleted user</span>
                  )}
                  <span className="text-xs text-text-secondary">
                    · {timeAgo(c.created_at)}
                  </span>
                  {viewerId === c.user_id && (
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="ml-auto rounded p-1 text-text-secondary hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-text-main">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
