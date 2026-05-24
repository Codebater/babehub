'use client';

import { useTransition } from 'react';
import { deletePost, publishDraft } from './actions';

/**
 * Inline action row under each post card. Uses transitions so the buttons
 * disable themselves while the server action runs, without needing
 * `useFormState` boilerplate (these actions have no per-call validation
 * UI).
 */
export default function PostActions({ postId, isDraft }: { postId: string; isDraft: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-border-color/40 pt-3 text-xs">
      {isDraft && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => publishDraft(postId))}
          className="rounded-full bg-primary px-3 py-1 font-bold text-white transition-colors hover:bg-pink-400 disabled:opacity-50"
        >
          Publish now
        </button>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm('Delete this post permanently? This cannot be undone.')) {
            startTransition(() => deletePost(postId));
          }
        }}
        className="ml-auto text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
