'use client';

import { useActionState, useState, useRef, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createPost, deleteMedia, type PostState } from '../actions';

type Tier = { id: string; name: string; price_cents: number; currency: string };

type Attachment = {
  /** Local-only id for keying React + tracking removal during upload. */
  localId: string;
  /** Preview URL — local object URL while uploading and after. */
  previewUrl: string;
  /** Set once the upload + media row insert succeed. */
  mediaId?: string;
  uploading: boolean;
  error?: string;
};

const MAX_ATTACHMENTS = 10;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per image

function SubmitButtons({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        name="action"
        value="draft"
        disabled={pending || disabled}
        className="rounded-full border border-border-color px-5 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        Save as draft
      </button>
      <button
        type="submit"
        name="action"
        value="publish"
        disabled={pending || disabled}
        className="rounded-full bg-primary px-6 py-2 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-pink-400/50 disabled:hover:scale-100"
      >
        {pending ? 'Publishing…' : 'Publish now'}
      </button>
    </div>
  );
}

const initial: PostState = {};

export default function PostComposer({ tiers }: { tiers: Tier[] }) {
  const [state, formAction] = useActionState(createPost, initial);
  const [body, setBody] = useState(state.values?.body ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const stillUploading = attachments.some((a) => a.uploading);

  const handleFiles = async (files: FileList) => {
    const remaining = MAX_ATTACHMENTS - attachments.length;
    const picked = Array.from(files).slice(0, Math.max(0, remaining));
    if (picked.length === 0) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // composer is behind requireCreator; should never happen

    const drafts = picked.map<Attachment>((file) => ({
      localId: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setAttachments((prev) => [...prev, ...drafts]);

    await Promise.all(
      picked.map(async (file, idx) => {
        const localId = drafts[idx].localId;
        try {
          if (!file.type.startsWith('image/')) {
            throw new Error('Only image files are supported.');
          }
          if (file.size > MAX_BYTES) {
            throw new Error(`Image must be under ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB.`);
          }

          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false,
              cacheControl: '3600',
            });
          if (uploadError) throw uploadError;

          const { data: mediaRow, error: insertError } = await supabase
            .from('media')
            .insert({
              owner_id: user.id,
              kind: 'image',
              storage_bucket: 'posts',
              storage_path: storagePath,
              mime_type: file.type,
              byte_size: file.size,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;

          setAttachments((prev) =>
            prev.map((a) =>
              a.localId === localId ? { ...a, mediaId: mediaRow.id, uploading: false } : a,
            ),
          );
        } catch (err) {
          setAttachments((prev) =>
            prev.map((a) =>
              a.localId === localId
                ? { ...a, uploading: false, error: err instanceof Error ? err.message : 'Upload failed' }
                : a,
            ),
          );
        }
      }),
    );
  };

  const removeAttachment = (localId: string) => {
    const target = attachments.find((a) => a.localId === localId);
    if (!target) return;

    setAttachments((prev) => prev.filter((a) => a.localId !== localId));
    URL.revokeObjectURL(target.previewUrl);

    if (target.mediaId) {
      startTransition(async () => {
        await deleteMedia(target.mediaId!);
      });
    }
  };

  const submittableMediaIds = attachments
    .filter((a) => a.mediaId && !a.error)
    .map((a) => a.mediaId!);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="body" className="mb-1 flex justify-between text-sm font-medium text-text-secondary">
          <span>What do you want to share?</span>
          <span className="text-xs text-text-secondary/70">{body.length} / 5000</span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={8}
          required
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write something for your subscribers…"
          className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* ── Image attachments ─────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">
            Images{' '}
            <span className="text-xs text-text-secondary/70">
              ({attachments.length}/{MAX_ATTACHMENTS})
            </span>
          </span>
          <button
            type="button"
            disabled={attachments.length >= MAX_ATTACHMENTS}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded-full border border-border-color px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus className="h-3 w-3" />
            Add images
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {attachments.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {attachments.map((att) => (
              <li
                key={att.localId}
                className="relative aspect-square overflow-hidden rounded-lg border border-border-color bg-secondary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.previewUrl}
                  alt=""
                  className={`h-full w-full object-cover ${att.uploading ? 'opacity-40' : ''}`}
                />
                {att.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
                {att.error && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-red-500/30 text-center text-[10px] text-white"
                    title={att.error}
                  >
                    Upload failed
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(att.localId)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hidden inputs for every successfully-uploaded media id, so the
          server action receives them as `media_ids[]`. */}
      {submittableMediaIds.map((id) => (
        <input key={id} type="hidden" name="media_ids" value={id} />
      ))}

      <div>
        <label htmlFor="tier_required_id" className="mb-1 block text-sm font-medium text-text-secondary">
          Who can see this?
        </label>
        <select
          id="tier_required_id"
          name="tier_required_id"
          defaultValue={state.values?.tier_required_id ?? 'public'}
          className="w-full appearance-none rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="public">🌍 Public — anyone on your profile</option>
          {tiers.length === 0 && (
            <option disabled>(create a tier first to gate posts)</option>
          )}
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              🔒 {tier.name} — subscribers only
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {stillUploading && (
        <p className="text-xs text-text-secondary">Images still uploading — wait before publishing.</p>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButtons disabled={stillUploading} />
      </div>
    </form>
  );
}
