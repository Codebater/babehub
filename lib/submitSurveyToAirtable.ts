export type SurveyFormBody = {
    name?: string;
    email?: string;
    whatsapp?: string;
    country?: string;
    isOver18?: string;
    isActiveCreator?: string;
    isGeneratingRevenue?: string;
    monthlyEarnings?: string;
    socialPlatform?: string;
    socialHandle?: string;
    contentType?: string;
    goals?: string;
    interestedInCampaigns?: boolean;
    agreesToProfitShare?: boolean;
};

/** Airtable often rejects empty strings on single-selects; omit optional empty fields. */
export function buildSurveyRecord(formData: SurveyFormBody): Record<string, string | boolean> {
    const goals = formData.goals?.trim();
    const whatsapp = formData.whatsapp?.trim();

    const record: Record<string, string | boolean> = {
        'Full Name': formData.name ?? '',
        'Email': formData.email ?? '',
        'Country': formData.country ?? '',
        'Age Over 18': formData.isOver18 === 'yes',
        'Active Creator': formData.isActiveCreator === 'yes',
        'Revenue Generating': formData.isGeneratingRevenue === 'yes',
        'Platform': formData.socialPlatform ?? '',
        'Handle': formData.socialHandle ?? '',
        'Content Type': formData.contentType ?? '',
        'Interested in Campaigns': Boolean(formData.interestedInCampaigns),
        'Profit Share Acknowledged': Boolean(formData.agreesToProfitShare),
    };

    // Omit if your base uses a Created time column instead (set AIRTABLE_OMIT_SUBMISSION_DATE=1 on Vercel)
    if (process.env.AIRTABLE_OMIT_SUBMISSION_DATE !== '1') {
        record['Submission Date'] = new Date().toISOString();
    }

    if (whatsapp) {
        record['WhatsApp'] = whatsapp;
    }

    if (goals) {
        record['Goals'] = goals;
    }

    if (formData.isGeneratingRevenue === 'yes' && formData.monthlyEarnings) {
        record['Monthly Earnings'] = formData.monthlyEarnings;
    }

    return record;
}

function formatAirtableError(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        return (err as { message: string }).message;
    }
    if (err && typeof err === 'object' && 'error' in err) {
        try {
            return JSON.stringify((err as { error: unknown }).error);
        } catch {
            /* fall through */
        }
    }
    return String(err);
}

export async function submitSurveyToAirtable(formData: SurveyFormBody): Promise<void> {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName =
        process.env.AIRTABLE_TABLE_ID ||
        process.env.AIRTABLE_TABLE_NAME ||
        'Survey Submissions';

    if (!apiKey || !baseId) {
        throw new Error('Airtable configuration missing (AIRTABLE_API_KEY or AIRTABLE_BASE_ID)');
    }

    try {
        // Use dynamic import so module load failures surface as handled API errors.
        const mod = await import('airtable');
        const Airtable = (mod as { default?: { configure: (v: { apiKey: string }) => void; base: (id: string) => any } }).default;
        if (!Airtable) {
            throw new Error('Airtable module failed to load');
        }
        Airtable.configure({ apiKey });
        const base = Airtable.base(baseId);
        const record = buildSurveyRecord(formData);
        await base(tableName).create([{ fields: record }]);
    } catch (e) {
        throw new Error(formatAirtableError(e));
    }
}
