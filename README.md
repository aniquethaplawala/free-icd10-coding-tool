# Free ICD-10 Coding Tool

Paste a clinical note and get ICD-10-CM code suggestions. Each code quotes the line in the note that supports it.

**How it works**
1. Your browser strips common identifiers (names, dates, phone numbers, record numbers) before sending.
2. A clinical language model suggests codes, each with a word-for-word quote from the note.
3. Every code is checked against the official CMS FY2027 ICD-10-CM list. Codes that aren't on it, or that have no supporting text, are dropped.
4. A second review pass checks each code's official description against its quote.

Suggestions only. A certified coder or the treating clinician should review every code before billing.

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faniquethaplawala%2Ffree-icd10-coding-tool&env=SULLY_ACCOUNT_ID,SULLY_API_KEY&envDescription=Model%20API%20keys&envLink=https%3A%2F%2Fdashboard.api.sully.ai)

It runs on Sully M1 (OpenAI-compatible). Get keys at [dashboard.api.sully.ai](https://dashboard.api.sully.ai) and set `SULLY_ACCOUNT_ID` and `SULLY_API_KEY`. Other options are in `.env.example`.

```bash
npm install
cp .env.example .env.local
npm run build && npm run start
npm run test:scrub
```

ICD-10-CM codes come from the CMS FY2027 release (public domain). To update the code list each October, run `node scripts/build-icd10.mjs path/to/icd10cm_order_YYYY.txt`.

Sample note: ACI-Bench (Yim et al. 2023), CC BY 4.0.

MIT License.
