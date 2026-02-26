import { supabase } from '@/lib/supabase'

const FUNCTION_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

export interface ReceiptParseResult {
  vendor: string
  total: number
  date: string
  suggested_category: string
  line_items: Array<{ description: string; amount: number }>
  currency: string
  confidence: number
}

export interface ReceiptParseResponse {
  success: boolean
  parsed: ReceiptParseResult
  receipt_id: string | null
  image_url: string
}

export async function parseReceiptImage(file: File): Promise<ReceiptParseResponse> {
  const headers = await getAuthHeaders()

  const formData = new FormData()
  formData.append('file', file)

  let response: Response
  try {
    response = await fetch(`${FUNCTION_BASE_URL}/parse-receipt`, {
      method: 'POST',
      headers: {
        // Do NOT set Content-Type — browser sets multipart boundary automatically
        ...headers,
      },
      body: formData,
    })
  } catch (err: any) {
    throw new Error(
      err?.message === 'Failed to fetch'
        ? 'Unable to reach AI service. Check your internet connection.'
        : err?.message || 'Network error'
    )
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Unknown error' }))
    if (response.status === 429) {
      throw new Error('AI quota exceeded. Please wait a few minutes and try again.')
    }
    throw new Error(errData.error || `Receipt parse failed with status ${response.status}`)
  }

  return response.json()
}

export interface BudgetForecastItem {
  category: string
  budget_amount: number
  spent_so_far: number
  projected_total: number
  percent_used: number
  percent_projected: number
  status: 'on_track' | 'warning' | 'over_budget'
  advice: string
}

export interface BudgetForecastResult {
  forecasts: BudgetForecastItem[]
  overall_summary: string
  days_remaining: number
  days_elapsed: number
}

export interface BudgetForecastResponse {
  success: boolean
  forecast: BudgetForecastResult
}

export async function fetchBudgetForecast(): Promise<BudgetForecastResult> {
  const headers = await getAuthHeaders()

  let response: Response
  try {
    response = await fetch(`${FUNCTION_BASE_URL}/forecast-budget`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
  } catch (err: any) {
    throw new Error(
      err?.message === 'Failed to fetch'
        ? 'Unable to reach AI service. Check your internet connection.'
        : err?.message || 'Network error'
    )
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Unknown error' }))
    if (response.status === 429) {
      throw new Error('AI quota exceeded. Please wait a few minutes and try again.')
    }
    throw new Error(errData.error || `Forecast failed with status ${response.status}`)
  }

  const data: BudgetForecastResponse = await response.json()
  return data.forecast
}
