'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, Link2, Trash2, Loader2, ImageIcon } from 'lucide-react';
import { upsertSiteImage, deleteSiteImage } from './actions';

/**
 * A single editable image slot in the marketing admin panel.
 *
 * Supports:
 *   - File upload (drag + drop or click to pick)
 *   - URL paste (toggle the URL input)
 *   - One-click clear
 *
 * The form submits to `upsertSiteImage` with multipart formData
 * (file takes precedence over url). Optimistic preview: on file pick,
 * shows a local ObjectURL immediately before the upload completes.
 */
export default function ImageSlot({
  slotKey,
  label,
  hint,
  currentUrl,
}: {
  slotKey: string;
  label: string;
  hint?: string;
  currentUrl?: string;
}) {
  const [preview, setPreview] = useState(currentUrl ?? '');
  const [showUrl, setShowUrl] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Optimistic preview
    setPreview(URL.createObjectURL(f));
    // Auto-submit
    formRef.current?.requestSubmit();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await upsertSiteImage(fd);
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      await deleteSiteImage(slotKey);
      setPreview('');
      setUrlValue('');
    });
  };

  return (
    <div className="rounded-2xl border border-border-color bg-card overflow-hidden">
      {/* Image preview area */}
      <div className="relative aspect-video bg-secondary flex items-center justify-center group">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-secondary/40">
            <ImageIcon className="h-10 w-10" />
            <span className="text-xs font-medium">No image set</span>
          </div>
        )}

        {/* Hover overlay: click to pick file */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-bold"
        >
          <Upload className="h-5 w-5" />
          {preview ? 'Replace image' : 'Upload image'}
        </button>

        {/* Spinner overlay during save */}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Slot meta + controls */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-bold text-text-main">{label}</p>
          {hint && <p className="text-xs text-text-secondary mt-0.5">{hint}</p>}
          <p className="text-[10px] font-mono text-text-secondary/50 mt-1">{slotKey}</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
          <input type="hidden" name="key" value={slotKey} />

          {/* Hidden file input — triggered by overlay click */}
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />

          {/* URL input toggle */}
          {showUrl ? (
            <div className="flex gap-2">
              <input
                name="url"
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 rounded-lg border border-border-color bg-secondary px-2.5 py-1.5 text-xs text-text-main placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!urlValue || pending}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setShowUrl(false); setUrlValue(''); }}
                className="rounded-lg border border-border-color px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-main"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-color bg-secondary px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setShowUrl(true)}
                disabled={pending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-color bg-secondary px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                <Link2 className="h-3.5 w-3.5" />
                URL
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={pending}
                  className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
