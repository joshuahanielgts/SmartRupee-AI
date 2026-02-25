# Gemini Proxy Edge Function - SmartRupee AI

This folder contains a Supabase Edge Function (Deno) that proxies requests to Google Gemini for AI-powered financial insights. Keep your GEMINI_API_KEY in Supabase Secrets — do NOT store it in client-side env.

Deployment steps

1. Create a Supabase Edge Function and copy the `index.ts` code.
2. In Supabase Project > Settings > API > Service key, add a secret named `GEMINI_API_KEY` with your Gemini API key.
3. Deploy the function via `supabase functions deploy gemini-proxy`.
