import Airtable from 'airtable';

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

export function buildSurveyRecord(formData: SurveyFormBody) {
    return {
        'Full Name': formData.name,
        'Email': formData.email,
        'WhatsApp': formData.whatsapp || '',
        'Country': formData.country,
        'Age Over 18': formData.isOver18 === 'yes',
        'Active Creator': formData.isActiveCreator === 'yes',
        'Revenue Generating': formData.isGeneratingRevenue === 'yes',
        'Monthly Earnings': formData.monthlyEarnings,
        'Platform': formData.socialPlatform,
        'Handle': formData.socialHandle,
        'Content Type': formData.contentType,
        'Goals': formData.goals || '',
        'Interested in Campaigns': formData.interestedInCampaigns,
        'Profit Share Acknowledged': formData.agreesToProfitShare,
        'Submission Date': new Date().toISOString(),
    };
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

    Airtable.configure({ apiKey });
    const base = Airtable.base(baseId);
    const record = buildSurveyRecord(formData);

    await base(tableName).create([{ fields: record }]);
}
