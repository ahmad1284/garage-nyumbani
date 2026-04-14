<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Garage Nyumbani

Mobile auto service platform for Zanzibar. Customers book mechanics online; admins manage bookings, send reminders, and generate PDF reports. Bilingual (Swahili default + English toggle). Deployed on Netlify.

## Features

### Customer Landing
- Book a service with AI-powered issue analysis (Gemini)
- Look up booking history by phone number → download PDF
- Service catalog with images, descriptions, and search/filter
- Light / Dark / System theme selector
- Swahili / English toggle (defaults to Swahili)
- Mobile "Call Now" floating button

### Admin Dashboard
- Manage bookings: assign mechanics, update status
- Search/filter across bookings, service records, and comms logs
- Cars Nearing Service Due alerts (14-day window, click-to-call)
- Download service history PDFs per customer
- Send reminders via WhatsApp (deep-link) or Africa's Talking SMS batch

## Run Locally

**Prerequisites:** Node.js, Netlify CLI

```bash
npm install
cp .env.local.example .env.local  # fill in required vars
netlify dev
```

> Use `netlify dev` (not `npm run dev`) — Netlify Blobs requires the Netlify runtime.

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini API key for AI issue analysis |
| `ADMIN_PASSWORD` | Yes | Admin dashboard login password |
| `AT_API_KEY` | No | Africa's Talking API key (SMS reminders disabled if absent) |

Set production variables via Netlify dashboard → Site settings → Environment variables.

## Run Tests

```bash
npm test
```

114 tests across unit + integration suites (Jest + jsdom).

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion (`motion/react`)
- **Storage**: Netlify Blobs
- **PDF**: jsPDF
- **Theme**: next-themes (Light/Dark/System)
- **i18n**: Custom EN/SW context (no external library)
- **SMS**: Africa's Talking (optional)
