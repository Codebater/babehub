<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BabeHub

Creator landing site + survey funnel. Submissions are stored in Airtable.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```
   npm install
   ```
2. Create `.env.local` with the required vars (see below)
3. Run the app:
   ```
   npm run dev
   ```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AIRTABLE_API_KEY` | yes | Personal access token from https://airtable.com/create/tokens — needs `data.records:write` on the base |
| `AIRTABLE_BASE_ID` | yes | The base ID, starts with `app...` (current: `appci65Qsp0KLHRNr`) |
| `AIRTABLE_TABLE_NAME` | no | Defaults to `Survey Submissions` |
| `AIRTABLE_TABLE_ID` | no | Use the `tbl...` ID instead of the name (more stable if the table is renamed) |
| `AIRTABLE_OMIT_SUBMISSION_DATE` | no | Set to `1` if you use a Created-time column instead of the manual `Submission Date` field |

Example `.env.local`:

```
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appci65Qsp0KLHRNr
AIRTABLE_TABLE_NAME=Survey Submissions
```

On Vercel: set the same vars under Project → Settings → Environment Variables (Production + Preview).

## Airtable schema

The `Survey Submissions` table expects these columns:

| Column | Type |
|--------|------|
| Name | Single line text (primary) |
| Email | Email |
| WhatsApp | Phone number |
| Country | Single line text |
| Over 18 | Checkbox |
| Active Creator | Checkbox |
| Generating Revenue | Checkbox |
| Monthly Earnings | Single select (`<1k`, `1k-5k`, `5k-10k`, `10k-20k`, `>20k`) |
| Social Platform | Single select (`Twitter`, `OnlyFans`, `Fansly`, `Instagram`, `TikTok`, `Loyalfans / Fanvue`) |
| Social Handle | Single line text |
| Content Type | Single select (`fully-explicit`, `some-explicit`, `non-explicit`) |
| Goals | Long text |
| Interested in Campaigns | Checkbox |
| Agrees to Profit Share | Checkbox |
| Submission Date | Date & time |
