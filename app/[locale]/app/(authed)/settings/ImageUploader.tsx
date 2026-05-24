'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Bucket = 'avatars' | 'covers';

type Props = {
  bucket: Bucket;
  userId: string;
  /** Which column on `profiles` to update with the new public URL. */
  columnName: 'avatar_url' | 'cover_url';
  /** Current image URL, or null if there isn't one yet. */
  currentUrl: string | null;
  /** Optional override CSS for the preview surface (e.g. avatar circle vs cover banner). */
  previewClassName?: string;
  /** What to render when there's no current image. */
  placeholder?: React.ReactNode;
  /** Recommended max size in bytes (default 5 MB). */
  maxBytes?: number;
};

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Client-side direct upload to Supabase Storage. RLS on `storage.objects`
 * is configured to allow the authenticated user to upload to a path
 * prefixed by their own `auth.uid()` (see 0001_phase1_init.sql storage
 * policies), so we deliberately use `<user_id>/<filename>` as the object
 * key.
 *
 * After a successful upload we get the public URL and patch the profile
 * row via the RLS-aware browser client. `router.refresh()` re-runs the
 * server components on this page so the new image appears without a
 * full reload.
 */
export default function ImageUploader({
  bucket,
  userId,
  columnName,
  currentUrl,
  previewClassName,
  placeholder,
  maxBytes = DEFAULT_MAX_BYTES,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optimistic preview while the upload + DB update is in flight.
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);

  const displayUrl = optimisticUrl ?? currentUrl;

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > maxBytes) {
      setError(`Image must be under ${(maxBytes / 1024 / 1024).toFixed(0)} MB.`);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    // Stable filename so each upload overwrites the last and the public URL
    // stays consistent (we still cache-bust below by appending ?v=).
    const objectPath = `${userId}/${bucket === 'avatars' ? 'avatar' : 'cover'}.${ext}`;

    const localPreview = URL.createObjectURL(file);
    setOptimisticUrl(localPreview);
    setBusy(true);

    try {
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(objectPath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      // Cache-bust so the browser fetches the new image even if the object
      // path stayed the same.
      const cacheBustedUrl = `${publicData.publicUrl}?v=${Date.now()}`;

      // Explicit branch so the typed Supabase client knows which column
      // we're updating — `.update({ [columnName]: ... })` would type-error
      // because TS can't statically narrow `columnName` to a known column.
      const update =
        columnName === 'avatar_url'
          ? { avatar_url: cacheBustedUrl }
          : { cover_url: cacheBustedUrl };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Swap optimistic preview for the real public URL and refresh the
      // server components so /c/{handle} also sees the change next render.
      setOptimisticUrl(cacheBustedUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setOptimisticUrl(null);
    } finally {
      setBusy(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  return (
    <div>
      <div className={`relative overflow-hidden ${previewClassName ?? ''}`}>
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          placeholder
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100 disabled:cursor-not-allowed"
          aria-label="Change image"
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <span className="flex items-center gap-2 text-sm font-medium">
              <Camera className="h-4 w-4" />
              Change
            </span>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so re-picking the same filename still fires onChange.
          e.target.value = '';
        }}
      />

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
