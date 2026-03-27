import { submitSurveyToAirtable, type SurveyFormBody } from '../lib/submitSurveyToAirtable';

/** Vercel Node serverless: https://vercel.com/docs/functions/runtimes/node-js */
export default async function handler(
    req: { method?: string; body?: SurveyFormBody },
    res: { status: (code: number) => { json: (data: unknown) => void } }
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        await submitSurveyToAirtable(req.body ?? {});
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Airtable Error:', err);
        res.status(500).json({
            error: 'Failed to submit to Airtable',
            details: err instanceof Error ? err.message : String(err),
        });
    }
}
