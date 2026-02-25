// SmartRupee AI - Gemini Edge Function
// Routes: /parse-receipt (Vision), /forecast-budget (Text), fallback (generic)
// Store GEMINI_API_KEY in Supabase secrets. Never expose it to clients.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReceiptParseResult {
  vendor: string;
  total: number;
  date: string;
  suggested_category: string;
  line_items: Array<{ description: string; amount: number }>;
  currency: string;
  confidence: number;
}

interface BudgetForecastItem {
  category: string;
  budget_amount: number;
  spent_so_far: number;
  projected_total: number;
  percent_used: number;
  percent_projected: number;
  status: "on_track" | "warning" | "over_budget";
  advice: string;
}

interface BudgetForecastResult {
  forecasts: BudgetForecastItem[];
  overall_summary: string;
  days_remaining: number;
  days_elapsed: number;
}

function getSupabaseClient(authHeader: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }
  const supabase = getSupabaseClient(authHeader);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized");
  }
  return { user, supabase, authHeader };
}

// ─── Receipt Parsing with Gemini Vision ─────────────────────────
async function parseReceipt(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<ReceiptParseResult> {
  const prompt = `You are a receipt parsing assistant for an Indian personal finance app called SmartRupee AI. 
Analyze this receipt image and extract the following information. Return ONLY valid JSON with no markdown formatting, no code blocks, and no extra text.

Required JSON structure:
{
  "vendor": "store/restaurant name",
  "total": 0.00,
  "date": "YYYY-MM-DD",
  "suggested_category": "one of: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Other",
  "line_items": [{"description": "item name", "amount": 0.00}],
  "currency": "INR",
  "confidence": 0.95
}

Rules:
- If the currency appears to be INR or ₹, keep amounts as-is.
- If the receipt is in another currency, still report amounts as shown but set currency accordingly.
- Date must be in YYYY-MM-DD format. If year is ambiguous, assume current year.
- suggested_category must be exactly one of the listed categories.
- confidence is a float 0.0 to 1.0 indicating how confident you are in the parse.
- If you cannot read a field, use reasonable defaults: vendor="Unknown", total=0, date=today's date.
- line_items can be empty array if individual items are not readable.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini Vision API error:", errText);
    throw new Error(`Gemini API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Strip markdown code fences if Gemini wraps the response
  const cleaned = textContent
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  try {
    const parsed: ReceiptParseResult = JSON.parse(cleaned);
    return {
      vendor: parsed.vendor || "Unknown",
      total: typeof parsed.total === "number" ? parsed.total : 0,
      date: parsed.date || new Date().toISOString().split("T")[0],
      suggested_category: parsed.suggested_category || "Other",
      line_items: Array.isArray(parsed.line_items) ? parsed.line_items : [],
      currency: parsed.currency || "INR",
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
  } catch {
    console.error("Failed to parse Gemini response as JSON:", cleaned);
    throw new Error(
      "Gemini returned unparseable response. Raw: " +
        cleaned.substring(0, 500)
    );
  }
}

// ─── Budget Forecast with Gemini Text ────────────────────────────
async function forecastBudgets(
  transactions: Array<{ amount: number; category: string; date: string }>,
  budgets: Array<{ category: string; amount: number; period: string }>,
  apiKey: string
): Promise<BudgetForecastResult> {
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  const spendingByCategory: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.amount < 0) {
      const cat = tx.category || "Other";
      spendingByCategory[cat] =
        (spendingByCategory[cat] || 0) + Math.abs(tx.amount);
    }
  }

  const prompt = `You are a financial advisor AI for SmartRupee AI, an Indian personal finance tracker.

Current date: ${now.toISOString().split("T")[0]}
Day ${dayOfMonth} of ${daysInMonth} in this month. ${daysRemaining} days remaining.

USER'S MONTHLY BUDGETS:
${JSON.stringify(
    budgets.filter((b) => b.period === "monthly"),
    null,
    2
  )}

SPENDING THIS MONTH BY CATEGORY (amounts are absolute values of expenses):
${JSON.stringify(spendingByCategory, null, 2)}

RECENT TRANSACTIONS (last 30 days):
${JSON.stringify(transactions.slice(0, 50), null, 2)}

Analyze the spending velocity and project end-of-month totals for each budget category.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "forecasts": [
    {
      "category": "Category Name",
      "budget_amount": 0.00,
      "spent_so_far": 0.00,
      "projected_total": 0.00,
      "percent_used": 0,
      "percent_projected": 0,
      "status": "on_track",
      "advice": "brief actionable advice"
    }
  ],
  "overall_summary": "2-3 sentence overall financial health summary for this month",
  "days_remaining": ${daysRemaining},
  "days_elapsed": ${dayOfMonth}
}

Rules:
- status must be one of: "on_track" (projected <= 80% of budget), "warning" (projected 80-100%), "over_budget" (projected > 100% or already over)
- projected_total = (spent_so_far / days_elapsed) * days_in_month
- percent_used = (spent_so_far / budget_amount) * 100
- percent_projected = (projected_total / budget_amount) * 100
- Include ONLY categories that have a budget defined
- Amounts in INR
- advice should be specific and actionable, 1-2 sentences max
- overall_summary in friendly tone`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", errText);
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const data = await response.json();
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const cleaned = textContent
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  try {
    const parsed: BudgetForecastResult = JSON.parse(cleaned);
    return {
      forecasts: Array.isArray(parsed.forecasts) ? parsed.forecasts : [],
      overall_summary:
        parsed.overall_summary || "Unable to generate summary.",
      days_remaining: daysRemaining,
      days_elapsed: dayOfMonth,
    };
  } catch {
    console.error("Failed to parse forecast response:", cleaned);
    throw new Error("Failed to parse AI forecast response");
  }
}

// ─── Main Server ─────────────────────────────────────────────────
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the URL to determine the action
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const action = pathSegments[pathSegments.length - 1];

    // ─── Route: Parse Receipt ──────────────────────────────────
    if (action === "parse-receipt" && req.method === "POST") {
      const { user, supabase } = await getUserFromRequest(req);

      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file uploaded" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
      ];
      if (!allowedTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({
            error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: "File too large. Maximum 10MB." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Read file as ArrayBuffer → base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      // Upload to Supabase Storage
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${timestamp}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(storagePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return new Response(
          JSON.stringify({ error: "Failed to upload receipt image" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get signed URL (bucket is private)
      const {
        data: { signedUrl },
      } = await supabase.storage
        .from("receipts")
        .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry

      // Parse with Gemini Vision
      const parseResult = await parseReceipt(base64, file.type, apiKey);

      // Save receipt record
      const { data: receiptRecord, error: receiptError } = await supabase
        .from("receipts")
        .insert({
          user_id: user.id,
          file_path: storagePath,
          file_name: file.name,
          image_url: signedUrl || storagePath,
          ai_parsed_data: parseResult,
          status: "parsed",
        })
        .select()
        .single();

      if (receiptError) {
        console.error("Receipt insert error:", receiptError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          parsed: parseResult,
          receipt_id: receiptRecord?.id || null,
          image_url: signedUrl || storagePath,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── Route: Budget Forecast ────────────────────────────────
    if (action === "forecast-budget" && req.method === "POST") {
      const { user, supabase } = await getUserFromRequest(req);

      // Fetch last 30 days of transactions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("amount, category, date")
        .eq("user_id", user.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (txError) {
        console.error("Transaction fetch error:", txError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch transactions" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Fetch budgets
      const { data: budgets, error: budgetError } = await supabase
        .from("budgets")
        .select("category, amount, period")
        .eq("user_id", user.id);

      if (budgetError) {
        console.error("Budget fetch error:", budgetError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch budgets" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!budgets || budgets.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            forecast: {
              forecasts: [],
              overall_summary:
                "No budgets set yet. Add budgets to get AI-powered spending forecasts!",
              days_remaining: 0,
              days_elapsed: 0,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const forecast = await forecastBudgets(
        transactions || [],
        budgets,
        apiKey
      );

      return new Response(
        JSON.stringify({ success: true, forecast }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── Fallback: Generic Gemini Text ─────────────────────────
    if (req.method === "POST") {
      await getUserFromRequest(req);

      const body = await req.json();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type":
            response.headers.get("content-type") || "application/json",
        },
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Edge function error:", err);

    const status =
      message === "Unauthorized" ||
      message === "Missing Authorization header"
        ? 401
        : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
