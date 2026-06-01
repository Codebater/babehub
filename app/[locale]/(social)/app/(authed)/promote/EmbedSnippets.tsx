'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Snippet = { id: string; label: string; hint: string; code: string };

export default function EmbedSnippets({
  handle,
  badgeUrl,
  profileUrl,
}: {
  handle: string;
  badgeUrl: string;
  profileUrl: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const alt = `${handle} on BabeHub`;

  const snippets: Snippet[] = [
    {
      id: 'html',
      label: 'HTML',
      hint: 'Personal sites, linktree custom HTML, blog footers',
      code: `<a href="${profileUrl}" target="_blank" rel="noopener">\n  <img src="${badgeUrl}" alt="${alt}" width="300" height="60" />\n</a>`,
    },
    {
      id: 'bbcode',
      label: 'BBCode',
      hint: 'Adult webmaster forums — GFY, XBIZ, signatures',
      code: `[url=${profileUrl}][img]${badgeUrl}[/img][/url]`,
    },
    {
      id: 'markdown',
      label: 'Markdown',
      hint: 'GitHub, Reddit, Notion, docs',
      code: `[![${alt}](${badgeUrl})](${profileUrl})`,
    },
    {
      id: 'link',
      label: 'Direct link',
      hint: 'OnlyFans bio, Twitter/X, Instagram — paste as plain URL',
      code: profileUrl,
    },
  ];

  const copy = async (s: Snippet) => {
    try {
      await navigator.clipboard.writeText(s.code);
      setCopied(s.id);
      setTimeout(() => setCopied((c) => (c === s.id ? null : c)), 1800);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  return (
    <div className="space-y-4">
      {snippets.map((s) => (
        <div key={s.id} className="rounded-2xl border border-border-color bg-card p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text-main">{s.label}</p>
              <p className="text-[11px] text-text-secondary">{s.hint}</p>
            </div>
            <button
              type="button"
              onClick={() => copy(s)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                copied === s.id
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-primary/10 text-primary ring-1 ring-primary/20 hover:bg-primary hover:text-white'
              }`}
            >
              {copied === s.id ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-border-color/60 bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed text-text-secondary">
            <code>{s.code}</code>
          </pre>
        </div>
      ))}
    </div>
  );
}
