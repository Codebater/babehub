'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Film, X, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { submitVideo } from './actions';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB (Supabase free-tier ceiling)

type Props = {
  /** True when the user is already at their pending/approved cap. */
  canUpload: boolean;
  capMessage?: string;
};

export default function UploadVideoForm({ canUpload, capMessage }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState<'idle' | 'uploading' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pickFile = (f: File) => {
    setError(null);
    if (!f.type.startsWith('video/')) {
      setError('Please choose a video file (mp4, mov, webm).');
      return;
    }
    if (f.size > MAX_VIDEO_BYTES) {
      setError(`Video must be under ${(MAX_VIDEO_BYTES / 1024 / 1024).toFixed(0)} MB.`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').slice(0, 140));
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setProgress('idle');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file || progress === 'uploading' || progress === 'saving') return;
    if (title.trim().length < 1) {
      setError('Please give your video a title.');
      return;
    }
    setError(null);
    setProgress('uploading');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Session expired — please refresh and sign in again.');
        setProgress('idle');
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(storagePath, file, { contentType: file.type, upsert: false, cacheControl: '3600' });

      if (uploadError) {
        setError(uploadError.message);
        setProgress('idle');
        return;
      }

      setProgress('saving');
      const result = await submitVideo(storagePath, title, {
        mimeType: file.type,
        byteSize: file.size,
      });

      if (!result.ok) {
        // Clean up the orphaned upload so it doesn't count against storage
        await supabase.storage.from('posts').remove([storagePath]);
        setError(result.error);
        setProgress('idle');
        return;
      }

      setProgress('done');
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
      setProgress('idle');
    }
  };

  if (!canUpload) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 text-sm text-amber-200">
        {capMessage ?? 'You have reached your upload limit.'}
      </div>
    );
  }

  if (progress === 'done') {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-green-400/30 bg-green-400/5 p-8 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-green-400" />
        <p className="text-base font-bold text-text-main">Video submitted for review</p>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">
          We&apos;ll review it shortly and let you know in your{' '}
          <span className="font-bold text-text-main">BabeHub chat</span> once it&apos;s approved.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-full bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400"
        >
          Upload another
        </button>
      </div>
    );
  }

  const busy = progress === 'uploading' || progress === 'saving';

  return (
    <div className="space-y-4">
      {/* Dropzone / preview */}
      {!file ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-color bg-secondary/30 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud className="h-7 w-7" />
          </span>
          <span className="text-sm font-bold text-text-main">Tap to choose a video</span>
          <span className="text-xs text-text-secondary">MP4 · MOV · WEBM — up to 50 MB</span>
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-color bg-black">
          <div className="relative aspect-video w-full">
            {previewUrl && (
              <video src={previewUrl} controls playsInline className="h-full w-full object-contain" />
            )}
            {!busy && (
              <button
                type="button"
                onClick={reset}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-500"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-text-secondary">
            <Film className="h-3.5 w-3.5" />
            <span className="truncate">{file.name}</span>
            <span className="ml-auto shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pickFile(f);
          e.target.value = '';
        }}
      />

      {/* Title */}
      {file && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Title <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your video a title…"
            className="w-full rounded-xl border border-border-color bg-secondary px-3 py-2.5 text-sm text-text-main placeholder-text-secondary/50 focus:border-primary/60 focus:outline-none"
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Submit */}
      {file && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress === 'uploading' ? 'Uploading…' : 'Submitting…'}
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              Submit for review
            </>
          )}
        </button>
      )}
    </div>
  );
}
