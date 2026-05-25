'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { XIcon, SpinnerIcon, HeartIcon, BabeHubLogo } from './IconComponents';

/**
 * B2B "Your banner could be here" inquiry modal. Visually mirrors the
 * creator-side SurveyModal (same shell, same progress bar, same submit
 * button rhythm) so the brand sponsor experience feels like part of the
 * same product — but the form is much shorter (2 steps), anonymous-
 * friendly (no name required), and asks B2B-shaped questions
 * (placement type, budget, timeline) instead of creator-shaped ones.
 *
 * Triggers:
 *   - SponsoredSlot ("Your banner could be here" billboard above
 *     Load-more on /explore)
 *   - FeaturedSlot ("Apply to be featured" card variant for B2B
 *     placements — featured jobs, collab spots)
 *
 * Backend: POST /api/banner-inquiry — writes to a separate Airtable
 * table (env: AIRTABLE_BANNER_TABLE) so brand leads don't pollute the
 * creator applicant table.
 *
 * Anonymous design choice: only `email` is required. Company, name,
 * website, budget, message are all optional. The minimum viable signal
 * is "someone wants to put a banner here, here's where to reach them".
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type InquiryKind = 'banner' | 'featured_job' | 'collab';

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-secondary border border-border-color rounded-md px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
  />
);

const SelectField = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full bg-secondary border border-border-color rounded-md px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none bg-no-repeat bg-right pr-8"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 0.5rem center',
      backgroundSize: '1.5em 1.5em',
    }}
  >
    {props.children}
  </select>
);

const TextareaField = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    rows={3}
    className="w-full bg-secondary border border-border-color rounded-md px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
  />
);

/**
 * Picker for the inquiry kind (Banner / Featured job / Collab).
 * Mirrors the SurveyModal's ChoiceBox visual exactly so the two modals
 * read as siblings.
 */
function ChoiceBox({
  label,
  hint,
  value,
  selectedValue,
  onSelect,
}: {
  label: string;
  hint: string;
  value: InquiryKind;
  selectedValue: InquiryKind | '';
  onSelect: (value: InquiryKind) => void;
}) {
  const isSelected = selectedValue === value;
  return (
    <div
      onClick={() => onSelect(value)}
      className={`flex-1 cursor-pointer rounded-lg border p-4 text-center transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-primary/20 text-text-main shadow-md'
          : 'border-border-color bg-secondary text-text-secondary hover:border-gray-500'
      }`}
    >
      <span className="block font-medium">{label}</span>
      <span className="mt-1 block text-xs text-text-secondary">{hint}</span>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = (current / total) * 100;
  return (
    <div className="w-full bg-secondary rounded-full h-2 mb-8">
      <div
        className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

const INITIAL_FORM = {
  kind: '' as InquiryKind | '',
  company: '',
  website: '',
  budget: '',
  timeline: '',
  message: '',
  name: '',
  email: '',
  telegram: '',
};

export default function BannerInquiryModal({ isOpen, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = 2;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setSubmitError(null);
      setCurrentStep(1);
      setFormData(INITIAL_FORM);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKindSelect = (value: InquiryKind) => {
    setFormData((prev) => ({ ...prev, kind: value }));
  };

  // Step 1 just needs the inquiry kind. Everything else (message,
  // budget, website, etc.) is optional — that's the "anonymous-by-
  // default" pitch. Step 2 only needs a working email.
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.kind !== '';
      case 2:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      default:
        return false;
    }
  };

  const handleNext = () => currentStep < totalSteps && setCurrentStep((s) => s + 1);
  const handleBack = () => currentStep > 1 && setCurrentStep((s) => s - 1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && currentStep < totalSteps) {
      e.preventDefault();
      if (canProceed()) handleNext();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (currentStep !== totalSteps || !canProceed()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/banner-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || `Request failed (${res.status})`);
      }
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const animationStyle = { animationDuration: '0.4s' };
  const stepContentClass = 'space-y-6 animate-fade-in-up';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in-up"
      style={{ animationDuration: '0.3s' }}
      onClick={onClose}
    >
      <div
        className="bg-card border border-border-color rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-colors"
          aria-label="Close"
        >
          <XIcon className="w-6 h-6" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-12 animate-fade-in-up flex-grow flex flex-col justify-center">
            <HeartIcon className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-text-main mb-2">Thanks — we&apos;ll be in touch.</h2>
            <p className="text-text-secondary">
              Our team replies to brand inquiries within 48 hours.
            </p>
            <button
              onClick={onClose}
              className="mt-8 bg-primary hover:bg-pink-400 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 self-center"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="relative inline-block mb-2">
                <h2 className="relative z-10 text-3xl font-bold text-text-main flex items-center justify-center gap-x-2">
                  <span>Get on</span>
                  <BabeHubLogo className="h-8 w-auto text-text-main" />
                </h2>
                <svg
                  className="absolute -bottom-4 left-0 w-full h-auto text-primary z-0"
                  viewBox="0 0 100 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 7 C 35 -3, 65 15, 98 5"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-text-secondary">
                Banners, featured jobs, creator collabs — pitch us a placement and we&apos;ll reply within 48h.
              </p>
            </div>
            <ProgressBar current={currentStep} total={totalSteps} />

            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex-grow flex flex-col">
              <div className="flex-grow">
                {currentStep === 1 && (
                  <div className={stepContentClass} style={animationStyle}>
                    <h3 className="text-xl font-bold text-text-main">What do you want to do?</h3>
                    <p className="text-text-secondary">
                      Pick the placement. Everything below is optional — leave whatever
                      you&apos;re not ready to share, and we&apos;ll figure the rest out together.
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <ChoiceBox
                        value="banner"
                        selectedValue={formData.kind}
                        onSelect={handleKindSelect}
                        label="Sponsored banner"
                        hint="High-traffic placement on /explore"
                      />
                      <ChoiceBox
                        value="featured_job"
                        selectedValue={formData.kind}
                        onSelect={handleKindSelect}
                        label="Featured job"
                        hint="Promote a casting / shoot"
                      />
                      <ChoiceBox
                        value="collab"
                        selectedValue={formData.kind}
                        onSelect={handleKindSelect}
                        label="Creator collab"
                        hint="Brand × creator campaign"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-text-secondary mb-1">
                          Brand / Company{' '}
                          <span className="text-xs text-text-secondary/70">(optional)</span>
                        </label>
                        <InputField
                          type="text"
                          name="company"
                          id="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Anonymous if blank"
                        />
                      </div>
                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-text-secondary mb-1">
                          Website{' '}
                          <span className="text-xs text-text-secondary/70">(optional)</span>
                        </label>
                        <InputField
                          type="text"
                          name="website"
                          id="website"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-text-secondary mb-1">
                          Budget range{' '}
                          <span className="text-xs text-text-secondary/70">(optional)</span>
                        </label>
                        <SelectField
                          name="budget"
                          id="budget"
                          value={formData.budget}
                          onChange={handleChange}
                        >
                          <option value="">Not sure yet</option>
                          <option value="<500">Under $500</option>
                          <option value="500-2k">$500 – $2,000</option>
                          <option value="2k-5k">$2,000 – $5,000</option>
                          <option value="5k-20k">$5,000 – $20,000</option>
                          <option value=">20k">$20,000+</option>
                        </SelectField>
                      </div>
                      <div>
                        <label htmlFor="timeline" className="block text-sm font-medium text-text-secondary mb-1">
                          Timeline{' '}
                          <span className="text-xs text-text-secondary/70">(optional)</span>
                        </label>
                        <SelectField
                          name="timeline"
                          id="timeline"
                          value={formData.timeline}
                          onChange={handleChange}
                        >
                          <option value="">Flexible</option>
                          <option value="asap">ASAP</option>
                          <option value="<1m">Within 1 month</option>
                          <option value="1-3m">1–3 months</option>
                          <option value=">3m">3+ months</option>
                        </SelectField>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label htmlFor="message" className="block text-sm font-medium text-text-secondary">
                          Anything we should know?{' '}
                          <span className="text-xs text-text-secondary/70">(optional)</span>
                        </label>
                        <span className="text-sm text-text-secondary">{formData.message.length} / 300</span>
                      </div>
                      <TextareaField
                        name="message"
                        id="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="A line about the campaign, the creator type you want, anything that helps us reply faster."
                        maxLength={300}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className={stepContentClass} style={animationStyle}>
                    <h3 className="text-xl font-bold text-text-main">How do we reach you?</h3>
                    <p className="text-text-secondary">
                      Just an email. Name and Telegram are optional if you&apos;d rather stay
                      anonymous until we&apos;re in DMs.
                    </p>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                        Email
                      </label>
                      <InputField
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@brand.com"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
                          Your name{' '}
                          <span className="text-xs text-text-secondary/70">(optional)</span>
                        </label>
                        <InputField
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Anonymous if blank"
                        />
                      </div>
                      <div>
                        <label htmlFor="telegram" className="block text-sm font-medium text-text-secondary mb-1">
                          Telegram / WhatsApp{' '}
                          <span className="text-xs text-text-secondary/70">(optional)</span>
                        </label>
                        <InputField
                          type="text"
                          name="telegram"
                          id="telegram"
                          value={formData.telegram}
                          onChange={handleChange}
                          placeholder="@handle or +1 555 …"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {submitError && (
                <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {submitError}
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-border-color flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`text-text-secondary hover:text-text-main font-bold py-2 px-4 rounded-md transition-all ${
                    currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  Back
                </button>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-primary hover:bg-pink-400 text-white font-bold py-2 px-8 rounded-full transition-all duration-300 disabled:bg-pink-400/50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !canProceed()}
                    className="bg-primary hover:bg-pink-400 text-white font-bold py-2 px-8 rounded-full transition-all duration-300 flex items-center justify-center disabled:bg-pink-400/50 disabled:cursor-not-allowed min-w-[150px]"
                  >
                    {isSubmitting ? (
                      <>
                        <SpinnerIcon className="w-5 h-5 mr-3 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Send inquiry'
                    )}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
