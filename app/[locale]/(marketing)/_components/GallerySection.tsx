'use client';

import { useTranslations } from 'next-intl';
import TextReveal from './TextReveal';

/**
 * Creator showcase gallery section.
 *
 * Renders up to 6 images uploaded by the admin via `/app/admin/marketing`.
 * Images are sourced from `public.site_settings` (keys `mkt_gallery_1..6`)
 * and passed in as the `images` prop from the server. Returns null if no
 * images are configured so the section is fully invisible to visitors until
 * the admin fills at least one slot.
 *
 * Layout: 2-column on mobile → 3-column on desktop. Each cell uses a square
 * (1:1) aspect ratio so the grid looks uniform regardless of the uploaded
 * image dimensions.
 */
interface GallerySectionProps {
  images: string[];
}

export default function GallerySection({ images }: GallerySectionProps) {
  const t = useTranslations();
  const filled = images.filter(Boolean).slice(0, 6);
  if (filled.length === 0) return null;

  return (
    <section id="gallery" className="py-20 bg-background transition-colors duration-700">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="mb-12 text-center">
          <TextReveal as="h2" className="mb-4 text-4xl font-bold text-text-main">
            {t('gallery.title', { defaultValue: 'Creator Showcase' })}
          </TextReveal>
          <TextReveal as="p" className="mx-auto max-w-2xl text-lg text-text-secondary">
            {t('gallery.subtitle', {
              defaultValue: 'A glimpse of the talent thriving on BabeHub.',
            })}
          </TextReveal>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:gap-5 max-w-5xl mx-auto">
          {filled.map((url, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl aspect-square bg-secondary border border-border-color/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Creator showcase ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
