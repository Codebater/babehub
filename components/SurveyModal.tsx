
import React, { useState, FormEvent, useEffect } from 'react';
import { XIcon, SpinnerIcon, HeartIcon, BabeHubLogo } from './IconComponents';
import { useLanguage } from '../hooks/useLanguage';

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

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
        style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
     >
        {props.children}
     </select>
);


const TextareaField = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        rows={4}
        className="w-full bg-secondary border border-border-color rounded-md px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
    />
);

const ChoiceBox = ({ label, name, value, selectedValue, onSelect }: { label: string; name: string; value: string; selectedValue: string; onSelect: (name: string, value: string) => void; }) => {
    const isSelected = selectedValue === value;
    return (
        <div
            onClick={() => onSelect(name, value)}
            className={`flex-1 p-4 border rounded-lg cursor-pointer text-center transition-all duration-200 ${
                isSelected 
                ? 'bg-primary/20 border-primary shadow-md text-text-main' 
                : 'bg-secondary border-border-color hover:border-gray-500 text-text-secondary'
            }`}
        >
            <span className="font-medium">{label}</span>
        </div>
    );
};

const CheckboxField = ({ label, name, checked, onChange }: { label: React.ReactNode; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
    <label htmlFor={name} className="flex items-center space-x-3 cursor-pointer group">
        <div className="relative flex items-center">
            <input
                id={name}
                name={name}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-border-color transition-all checked:border-primary checked:bg-primary"
            />
            <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1"
                >
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    ></path>
                </svg>
            </div>
        </div>
        <span className="text-sm text-text-secondary group-hover:text-text-main transition-colors">{label}</span>
    </label>
);


const ProgressBar: React.FC<{current: number, total: number}> = ({current, total}) => {
    const progress = (current / total) * 100;
    return (
        <div className="w-full bg-secondary rounded-full h-2 mb-8">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

const SurveyModal: React.FC<SurveyModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        isOver18: '',
        socialPlatform: '',
        socialHandle: '',
        country: '',
        isActiveCreator: '',
        isGeneratingRevenue: '',
        monthlyEarnings: '',
        goals: '',
        contentType: '',
        interestedInCampaigns: false,
        agreesToProfitShare: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const totalSteps = 3;

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    // Reset form when modal is reopened
    useEffect(() => {
        if (isOpen) {
            setIsSubmitted(false);
            setSubmitError(null);
            setCurrentStep(1);
            setFormData({
                name: '',
                email: '',
                whatsapp: '',
                isOver18: '',
                socialPlatform: '',
                socialHandle: '',
                country: '',
                isActiveCreator: '',
                isGeneratingRevenue: '',
                monthlyEarnings: '',
                goals: '',
                contentType: '',
                interestedInCampaigns: false,
                agreesToProfitShare: false
            });
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleChoiceChange = (name: string, value: string) => {
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'isGeneratingRevenue' && value === 'no') {
                newState.monthlyEarnings = '';
            }
            return newState;
        });
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                const revenueCheck = formData.isGeneratingRevenue === 'yes' ? formData.monthlyEarnings !== '' : true;
                return formData.isOver18 === 'yes' && formData.isActiveCreator !== '' && formData.isGeneratingRevenue !== '' && revenueCheck && formData.country !== '';
            case 2:
                return formData.socialPlatform.trim() !== '' && formData.socialHandle.trim() !== '' && formData.contentType.trim() !== '';
            case 3:
                 return formData.name.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
            default:
                return false;
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter' && currentStep < totalSteps) {
            e.preventDefault();
            if (canProceed()) {
                handleNext();
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (currentStep !== totalSteps || !canProceed()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        const apiBase =
            (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? '';

        try {
            const res = await fetch(`${apiBase}/api/survey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const raw = await res.text();
            let data: { error?: string; details?: string } = {};
            try {
                data = JSON.parse(raw) as { error?: string; details?: string };
            } catch {
                if (raw) {
                    data.details = raw.slice(0, 300);
                }
            }

            if (!res.ok) {
                throw new Error(data.details || data.error || `Request failed (${res.status})`);
            }

            setIsSubmitted(true);
        } catch (err) {
            console.error('Survey submit failed:', err);
            setSubmitError(err instanceof Error ? err.message : t('survey.submit_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = () => {
        const stepContentClass = "space-y-6 animate-fade-in-up";
        const animationStyle = { animationDuration: '0.4s' };
        const yes = t('survey.yes');
        const no = t('survey.no');

        switch(currentStep) {
            case 1:
                return (
                    <div key={1} className={stepContentClass} style={animationStyle}>
                        <h3 className="text-xl font-bold text-text-main">{t('survey.step1.title')}</h3>
                        <p className="text-text-secondary">{t('survey.step1.subtitle')}</p>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">{t('survey.step1.q_age')}</label>
                            <div className="flex space-x-4">
                                <ChoiceBox name="isOver18" value="yes" selectedValue={formData.isOver18} onSelect={handleChoiceChange} label={yes} />
                                <ChoiceBox name="isOver18" value="no" selectedValue={formData.isOver18} onSelect={handleChoiceChange} label={no} />
                            </div>
                            {formData.isOver18 === 'no' && (
                                <p className="text-sm text-red-500 mt-2">{t('survey.step1.q_age_error')}</p>
                            )}
                        </div>
                         <div>
                           <label className="block text-sm font-medium text-text-secondary mb-2">{t('survey.step1.q_creator')}</label>
                           <div className="flex space-x-4">
                               <ChoiceBox name="isActiveCreator" value="yes" selectedValue={formData.isActiveCreator} onSelect={handleChoiceChange} label={yes} />
                               <ChoiceBox name="isActiveCreator" value="no" selectedValue={formData.isActiveCreator} onSelect={handleChoiceChange} label={no} />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-text-secondary mb-2">{t('survey.step1.q_revenue')}</label>
                           <div className="flex space-x-4">
                               <ChoiceBox name="isGeneratingRevenue" value="yes" selectedValue={formData.isGeneratingRevenue} onSelect={handleChoiceChange} label={yes} />
                               <ChoiceBox name="isGeneratingRevenue" value="no" selectedValue={formData.isGeneratingRevenue} onSelect={handleChoiceChange} label={no} />
                           </div>
                        </div>
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-text-secondary mb-1">{t('survey.step1.q_country')}</label>
                            <SelectField name="country" id="country" value={formData.country} onChange={handleChange} required>
                                <option value="" disabled>{t('survey.step1.country_placeholder')}</option>
                                <option value="US">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="CA">Canada</option>
                                <option value="AU">Australia</option>
                                <option value="DE">Germany</option>
                                <option value="FR">France</option>
                                <option value="ES">Spain</option>
                                <option value="IT">Italy</option>
                                <option value="NL">Netherlands</option>
                                <option value="BR">Brazil</option>
                                <option value="MX">Mexico</option>
                                <option value="CO">Colombia</option>
                                <option value="TH">Thailand</option>
                                <option value="JP">Japan</option>
                                <option value="Other">Other</option>
                            </SelectField>
                        </div>
                        {formData.isGeneratingRevenue === 'yes' && (
                            <div className="animate-fade-in-up" style={{animationDuration: '0.4s'}}>
                                <label htmlFor="monthlyEarnings" className="block text-sm font-medium text-text-secondary mb-1">{t('survey.step1.q_earnings')}</label>
                                <SelectField name="monthlyEarnings" id="monthlyEarnings" value={formData.monthlyEarnings} onChange={handleChange} required>
                                    <option value="" disabled>{t('survey.step1.earnings_placeholder')}</option>
                                    <option value="<1k">{t('survey.step1.earnings_o1')}</option>
                                    <option value="1k-5k">$1,000 - $5,000</option>
                                    <option value="5k-10k">$5,000 - $10,000</option>
                                    <option value="10k-20k">$10,000 - $20,000</option>
                                    <option value=">20k">{t('survey.step1.earnings_o2')}</option>
                                </SelectField>
                            </div>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div key={2} className={stepContentClass} style={animationStyle}>
                        <h3 className="text-xl font-bold text-text-main">{t('survey.step2.title')}</h3>
                        <p className="text-text-secondary">{t('survey.step2.subtitle')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="socialPlatform" className="block text-sm font-medium text-text-secondary mb-1">{t('survey.step2.q_platform')}</label>
                                <SelectField name="socialPlatform" id="socialPlatform" value={formData.socialPlatform} onChange={handleChange} required>
                                    <option value="" disabled>{t('survey.step2.platform_placeholder')}</option>
                                    <option value="Twitter">Twitter</option>
                                    <option value="OnlyFans">OnlyFans</option>
                                    <option value="Fansly">Fansly</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="TikTok">Tik Tok</option>
                                    <option value="Loyalfans / Fanvue">Loyalfans / Fanvue</option>
                                </SelectField>
                            </div>
                            <div>
                                <label htmlFor="socialHandle" className="block text-sm font-medium text-text-secondary mb-1">{t('survey.step2.q_handle')}</label>
                                <InputField type="text" name="socialHandle" id="socialHandle" value={formData.socialHandle} onChange={handleChange} placeholder="@username" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="contentType" className="block text-sm font-medium text-text-secondary mb-1">{t('survey.step2.q_content')}</label>
                            <SelectField name="contentType" id="contentType" value={formData.contentType} onChange={handleChange} required>
                                <option value="" disabled>{t('survey.step2.content_placeholder')}</option>
                                <option value="fully-explicit">{t('survey.step2.content_o1')}</option>
                                <option value="some-explicit">{t('survey.step2.content_o2')}</option>
                                <option value="non-explicit">{t('survey.step2.content_o3')}</option>
                            </SelectField>
                        </div>
                        <div>
                             <div className="flex justify-between items-center mb-1">
                                <label htmlFor="goals" className="block text-sm font-medium text-text-secondary">{t('survey.step2.q_goals')}</label>
                                <span className="text-sm text-text-secondary">{formData.goals.length} / 100</span>
                            </div>
                            <TextareaField name="goals" id="goals" value={formData.goals} onChange={handleChange} placeholder={t('survey.step2.goals_placeholder')} maxLength={100} />
                        </div>
                         <div className="space-y-4 pb-4">
                           <CheckboxField
                                name="interestedInCampaigns"
                                checked={formData.interestedInCampaigns}
                                onChange={handleChange}
                                label={
                                    <span>
                                        {t('survey.step2.check_campaigns_part1')}
                                        <strong className="font-semibold text-text-main">{t('survey.step2.check_campaigns_highlight1')}</strong>
                                        {t('survey.step2.check_campaigns_part2')}
                                        <strong className="font-semibold text-text-main">{t('survey.step2.check_campaigns_highlight2')}</strong>
                                        {t('survey.step2.check_campaigns_part3')}
                                    </span>
                                }
                           />
                            <CheckboxField
                                name="agreesToProfitShare"
                                checked={formData.agreesToProfitShare}
                                onChange={handleChange}
                                label={
                                     <span>
                                        {t('survey.step2.check_profit_part1')}
                                        <strong className="font-semibold text-text-main">{t('survey.step2.check_profit_highlight1')}</strong>
                                        {t('survey.step2.check_profit_part2')}
                                    </span>
                                }
                            />
                        </div>
                    </div>
                );
            case 3:
                 return (
                    <div key={3} className={stepContentClass} style={animationStyle}>
                        <h3 className="text-xl font-bold text-text-main">{t('survey.step3.title')}</h3>
                        <p className="text-text-secondary">{t('survey.step3.subtitle')}</p>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">{t('survey.step3.q_name')}</label>
                            <InputField type="text" name="name" id="name" value={formData.name} onChange={handleChange} placeholder={t('survey.step3.name_placeholder')} required />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">{t('survey.step3.q_email')}</label>
                            <InputField type="email" name="email" id="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                        </div>
                        <div>
                            <label htmlFor="whatsapp" className="block text-sm font-medium text-text-secondary mb-1">{t('survey.step3.q_whatsapp')}</label>
                            <InputField type="tel" name="whatsapp" id="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="+1 123 456 7890" />
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in-up"
            style={{animationDuration: '0.3s'}}
            onClick={onClose}
        >
            <div
                className="bg-card border border-border-color rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-colors"
                    aria-label={t('survey.close')}
                >
                    <XIcon className="w-6 h-6" />
                </button>

                {isSubmitted ? (
                    <div className="text-center py-12 animate-fade-in-up flex-grow flex flex-col justify-center">
                        <HeartIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-text-main mb-2">{t('survey.submitted.title')}</h2>
                        <p className="text-text-secondary">{t('survey.submitted.subtitle')}</p>
                         <button
                            onClick={onClose}
                            className="mt-8 bg-primary hover:bg-pink-400 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 self-center"
                        >
                            {t('survey.submitted.button')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-4">
                            <div className="relative inline-block mb-2">
                                <h2 className="relative z-10 text-3xl font-bold text-text-main flex items-center justify-center gap-x-2">
                                    <span>{t('survey.title_prefix')}</span>
                                    <BabeHubLogo className="h-8 w-auto text-text-main" />
                                    <span>{t('survey.title_suffix')}</span>
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
                            <p className="text-text-secondary">{t('survey.subtitle')}</p>
                        </div>
                        <ProgressBar current={currentStep} total={totalSteps} />

                        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex-grow flex flex-col">
                            <div className="flex-grow">
                                {renderStepContent()}
                            </div>

                            {submitError && (
                                <p className="mt-4 text-sm text-red-500" role="alert">
                                    {submitError}
                                </p>
                            )}
                            <div className="mt-8 pt-4 border-t border-border-color flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className={`text-text-secondary hover:text-text-main font-bold py-2 px-4 rounded-md transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                >
                                    {t('survey.back')}
                                </button>

                                {currentStep < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!canProceed()}
                                        className="bg-primary hover:bg-pink-400 text-white font-bold py-2 px-8 rounded-full transition-all duration-300 disabled:bg-pink-400/50 disabled:cursor-not-allowed"
                                    >
                                        {t('survey.next')}
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
                                                {t('survey.submitting')}
                                            </>
                                        ) : (
                                            t('survey.submit')
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
};

export default SurveyModal;
