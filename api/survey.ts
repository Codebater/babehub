type SurveyFormBody = {
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

function parseBody(raw: { body?: unknown }): SurveyFormBody {
    const b = raw.body;
    if (b == null) return {};
    if (typeof b === 'string') {
        try {
            return JSON.parse(b) as SurveyFormBody;
        } catch {
            return {};
        }
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(b)) {
        try {
            return JSON.parse(b.toString('utf8')) as SurveyFormBody;
        } catch {
            return {};
        }
    }
    if (typeof b === 'object') return b as SurveyFormBody;
    return {};
}

function buildRecord(formData: SurveyFormBody): Record<string, string | boolean> {
    const record: Record<string, string | boolean> = {
        'Name': formData.name ?? '',
        'Email': formData.email ?? '',
        'Over 18': formData.isOver18 === 'yes',
        'Active Creator': formData.isActiveCreator === 'yes',
        'Generating Revenue': formData.isGeneratingRevenue === 'yes',
        'Social Platform': formData.socialPlatform ?? '',
        'Social Handle': formData.socialHandle ?? '',
        'Content Type': formData.contentType ?? '',
        'Interested in Campaigns': Boolean(formData.interestedInCampaigns),
        'Agrees to Profit Share': Boolean(formData.agreesToProfitShare),
    };

    if (process.env.AIRTABLE_OMIT_SUBMISSION_DATE !== '1') {
        record['Submission Date'] = new Date().toISOString();
    }
    if (formData.whatsapp?.trim()) {
        record['WhatsApp'] = formData.whatsapp.trim();
    }
    if (formData.goals?.trim()) {
        record['Goals'] = formData.goals.trim();
    }
    // Add only if your table has this column.
    if (formData.country?.trim() && process.env.AIRTABLE_COUNTRY_FIELD_NAME) {
        record[process.env.AIRTABLE_COUNTRY_FIELD_NAME] = formData.country.trim();
    }
    if (formData.isGeneratingRevenue === 'yes' && formData.monthlyEarnings) {
        record['Monthly Earnings'] = formData.monthlyEarnings;
    }

    return record;
}

function toErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
            return (err as { message: string }).message;
        }
        if ('error' in err) {
            try {
                return JSON.stringify((err as { error: unknown }).error);
            } catch {
                return 'Unknown Airtable error';
            }
        }
    }
    return String(err);
}

/** Vercel Node serverless: https://vercel.com/docs/functions/runtimes/node-js */
export default async function handler(
    req: { method?: string; body?: unknown },
    res: { status: (code: number) => { json: (data: unknown) => void } }
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const body = parseBody(req);
        if (!body.name?.trim() || !body.email?.trim()) {
            res.status(400).json({ error: 'Bad Request', details: 'Missing name or email' });
            return;
        }

        const apiKey = process.env.AIRTABLE_API_KEY;
        const baseId = process.env.AIRTABLE_BASE_ID;
        const tableName =
            process.env.AIRTABLE_TABLE_ID ||
            process.env.AIRTABLE_TABLE_NAME ||
            'Survey Submissions';

        if (!apiKey || !baseId) {
            throw new Error('Airtable configuration missing (AIRTABLE_API_KEY or AIRTABLE_BASE_ID)');
        }

        const mod = await import('airtable');
        const Airtable = mod.default;
        if (!Airtable) {
            throw new Error('Failed to load Airtable SDK');
        }

        Airtable.configure({ apiKey });
        const base = Airtable.base(baseId);
        await base(tableName).create([{ fields: buildRecord(body) }]);

        res.status(200).json({ success: true });
    } catch (err) {
        const details = toErrorMessage(err);
        console.error('Survey function error:', details);
        res.status(500).json({ error: 'Failed to submit to Airtable', details });
    }
}
