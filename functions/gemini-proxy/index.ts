// Example Supabase Edge Function (Deno) to proxy requests to Google Gemini
// Store GEMINI_API_KEY in Supabase secrets and never expose it to clients.

import { serve } from 'std/server'

serve(async (req) => {
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'missing api key' }), { status: 500 })
    }

    const body = await req.json()

    // Example call - adapt to the Gemini API shape you need
    const resp = await fetch('https://generativeai.googleapis.com/v1beta2/models/text-bison-001:generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    const data = await resp.text()
    return new Response(data, { status: resp.status, headers: { 'content-type': resp.headers.get('content-type') || 'application/json' } })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
