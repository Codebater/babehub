/**
 * Preset chip libraries for the professional-profile editor.
 *
 * These are the suggestions shown as clickable chips in
 * `ProfessionalProfileForm.tsx` — users can also add custom tags via
 * the picker's free-text add input. Server-side validation only caps
 * length and de-dupes; it does NOT enforce membership of these lists,
 * so they stay easy to extend without a migration.
 *
 * All values are lowercased before display + storage so chip matching
 * is case-insensitive ("Casting" == "casting").
 */

export const PRESET_CATEGORIES = [
  'casting',
  'live cams',
  'luxury shoots',
  'ugc',
  'modeling',
  'photography',
  'videography',
  'brand deals',
  'content creation',
  'streaming',
  'fashion',
  'fitness',
  'beauty',
  'lifestyle',
] as const;

export const PRESET_SKILLS = [
  'modeling',
  'acting',
  'dancing',
  'singing',
  'photography',
  'videography',
  'editing',
  'scriptwriting',
  'storytelling',
  'voice acting',
  'cosplay',
  'makeup',
  'styling',
  'hair',
  'fitness',
  'yoga',
  'pilates',
  'dj',
  'music production',
  'live streaming',
  'camming',
  'brand strategy',
  'social media',
  'posing',
  'lighting',
  'improv',
  'public speaking',
  'cooking',
  'gaming',
  'travel',
] as const;

export const PRESET_LANGUAGES = [
  'english',
  'german',
  'spanish',
  'french',
  'italian',
  'portuguese',
  'dutch',
  'polish',
  'russian',
  'ukrainian',
  'turkish',
  'arabic',
  'mandarin',
  'cantonese',
  'japanese',
  'korean',
  'thai',
  'vietnamese',
  'indonesian',
  'hindi',
] as const;
