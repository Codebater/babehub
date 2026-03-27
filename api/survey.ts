import { submitSurveyToAirtable, type SurveyFormBody } from '../lib/submitSurveyToAirtable';

function parseBody(raw: { body?: unknown }): SurveyFormBody {
    const b = raw.body;
    if (b == null) {
        return {};
    }
    if (typeof b === 'string') {
        try {
            return JSON.parse(b) as SurveyFormBody;
        } catch {
            return {};
        }
    }
    if (Buffer.isBuffer(b)) {
        try {
            return JSON.parse(b.toString('utf8')) as SurveyFormBody;
        } catch {
            return {};
        }
    }
    if (typeof b === 'object') {
        return b as SurveyFormBody;
    }
    return {};
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

    const body = parseBody(req);

    if (!body.name?.trim() || !body.email?.trim()) {
        res.status(400).json({ error: 'Bad Request', details: 'Missing name or email' });
        return;
    }

    try {
        await submitSurveyToAirtable(body);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Airtable Error:', err);
        res.status(500).json({
            error: 'Failed to submit to Airtable',
            details: err instanceof Error ? err.message : String(err),
        });
    }
}
