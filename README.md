<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/13edebb6-ed54-4179-98cf-2da0069b9152

## Run Locally

**Prerequisites:** Node.js, Netlify CLI

1. Install dependencies:
   `npm install`
2. Copy `.env.local` and set required variables:
   ```
   GEMINI_API_KEY=your-gemini-key
   ADMIN_PASSWORD=your-admin-password
   ```
3. Run the app with Netlify CLI (required for Blobs):
   `netlify dev`

> **Note:** Use `netlify dev` instead of `npm run dev` when working with Netlify Blobs. Plain `npm run dev` will not have access to the Blobs runtime.

For production, set `ADMIN_PASSWORD` via Netlify dashboard → Site settings → Environment variables.
