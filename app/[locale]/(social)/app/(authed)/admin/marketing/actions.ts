'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Save a marketing image slot.
 *
 * Accepts either a file upload (stored in the `marketing` Supabase Storage
 * bucket and the public URL recorded) or a plain URL string pasted by the
 * admin. File upload takes precedence when both are provided.
 *
 * The key is the `site_settings.key` for this image slot, e.g.
 * `mkt_hero_feature` or `mkt_gallery_3`.
 */
export async function upsertSiteImage(formData: FormData): Promise<void> {
  await requireAdmin();

  const key = String(formData.get('key') ?? '').trim();
  if (!key) throw new Error('Missing image slot key.');

  const file = formData.get('file') as File | null;
  const urlInput = String(formData.get('url') ?? '').trim();

  const admin = createAdminClient();
  let imageUrl = urlInput;

  // File upload → store in `marketing` bucket, use public URL
  if (file && file.size > 0) {
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const path = `${key}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { data: uploaded, error: uploadErr } = await admin.storage
      .from('marketing')
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (uploadErr || !uploaded) {
      throw new Error(`Upload failed: ${uploadErr?.message ?? 'unknown'}`);
    }

    const { data: { publicUrl } } = admin.storage
      .from('marketing')
      .getPublicUrl(uploaded.path);

    imageUrl = publicUrl;
  }

  if (!imageUrl) throw new Error('Provide an image file or paste a URL.');

  // site_settings is not in the generated Supabase types — cast to any to bypass strict typing
  const db = admin as any;
  const { error } = await db
    .from('site_settings')
    .upsert(
      { key, value: imageUrl, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );

  if (error) throw new Error(`Settings save failed: ${(error as { message: string }).message}`);

  revalidatePath('/');
  revalidatePath('/marketing');
  revalidatePath('/app/admin/marketing');
}

/** Remove an image slot (clears the URL from site_settings). */
export async function deleteSiteImage(key: string): Promise<void> {
  await requireAdmin();
  const db = createAdminClient() as any;
  await db.from('site_settings').delete().eq('key', key);
  revalidatePath('/');
  revalidatePath('/marketing');
  revalidatePath('/app/admin/marketing');
}
