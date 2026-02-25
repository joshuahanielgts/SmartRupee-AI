import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchBudgetForecast, BudgetForecastResult, BudgetForecastItem } from '@/services/ai'
import { listBudgets, createBudget, deleteBudget, Budget } from '@/services/budgets'
import { formatCurrency } from '@/lib/utils'
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, RefreshCw, Plus, Trash2, Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'react-toastify'

const BUDGET_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other',
]

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'on_track':
      return <CheckCircle2 className="w-5 h-5 text-green-400" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />
    case 'over_budget':
      return <ShieldAlert className="w-5 h-5 text-red-400" />
    default:
      return <CheckCircle2 className="w-5 h-5 text-neutral-400" />
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'on_track':
      return 'text-green-400'
    case 'warning':
      return 'text-yellow-400'
    case 'over_budget':
      return 'text-red-400'
    default:
      return 'text-neutral-400'
  }
}

function getProgressBarColor(status: string): string {
  switch (status) {
    case 'on_track':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'over_budget':
      return 'bg-red-500'
    default:
      return 'bg-neutral-500'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'on_track':
      return 'On Track'
    case 'warning':
      return 'Warning'
    case 'over_budget':
      return 'Over Budget'
    default:
      return status
  }
}

export default function BudgetForecast() {
  const { user } = useAuth()
  const [forecast, setForecast] = useState<BudgetForecastResult | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(false)
  const [budgetsLoading, setBudgetsLoading] = useState(true)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [newCategory, setNewCategory] = useState(BUDGET_CATEGORIES[0])
  const [newAmount, setNewAmount] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  const loadBudgets = useCallback(async () => {
    if (!user?.id) return
    setBudgetsLoading(true)
    try {
      const data = await listBudgets(user.id)
      setBudgets(data)
    } catch (err) {
      console.error('Failed to load budgets:', err)
    } finally {
      setBudgetsLoading(false)
    }
  }, [user?.id])

  const loadForecast = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const result = await fetchBudgetForecast()
      setForecast(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load forecast'
      console.error('Forecast error:', message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadBudgets()
  }, [loadBudgets])

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !newAmount || isNaN(Number(newAmount))) return

    setSavingBudget(true)
    try {
      await createBudget({
        user_id: user.id,
        category: newCategory,
        amount: Number(newAmount),
        period: 'monthly',
      })
      toast.success(`Budget added for ${newCategory}`)
      setShowBudgetForm(false)
      setNewAmount('')
      setNewCategory(BUDGET_CATEGORIES[0])
      loadBudgets()
      setForecast(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save budget'
      toast.error(message)
    } finally {
      setSavingBudget(false)
    }
  }

  const handleDeleteBudget = async (id: string, category: string) => {
    try {
      await deleteBudget(id)
      toast.success(`Removed budget for ${category}`)
      loadBudgets()
      setForecast(null)
    } catch {
      toast.error('Failed to remove budget')
    }
  }

  const availableCategories = BUDGET_CATEGORIES.filter(
    (cat) => !budgets.some((b) => b.category === cat)
  )

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">AI Budget Forecast</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBudgetForm(true)}
            disabled={availableCategories.length === 0}
            className="px-3 py-2 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center space-x-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add budget"
          >
            <Plus className="w-4 h-4" />
            <span>Add Budget</span>
          </button>
          <button
            onClick={loadForecast}
            disabled={loading || budgets.length === 0}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition flex items-center space-x-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Generate AI forecast"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{loading ? 'Analyzing...' : 'Generate Forecast'}</span>
          </button>
        </div>
      </div>

      {/* Budget List */}
      {budgetsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-8 border border-white/10 text-center">
          <Brain className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400 mb-2">No budgets set yet</p>
          <p className="text-neutral-500 text-sm mb-4">
            Add monthly budgets for your spending categories to get AI-powered forecasts
          </p>
          <button
            onClick={() => setShowBudgetForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
          >
            Set Your First Budget
          </button>
        </div>
      ) : (
        <>
          {/* Current Budgets */}
          <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-4 border border-white/10">
            <p className="text-neutral-400 text-sm mb-3">Your Monthly Budgets</p>
            <div className="flex flex-wrap gap-2">
              {budgets.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg group"
                >
                  <span className="text-neutral-300 text-sm">{b.category}</span>
                  <span className="text-purple-400 font-medium text-sm">{formatCurrency(b.amount)}</span>
                  <button
                    onClick={() => handleDeleteBudget(b.id!, b.category)}
                    className="p-1 text-neutral-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    aria-label={`Delete ${b.category} budget`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast Results */}
          {forecast && (
            <div className="space-y-4">
              {/* Overall Summary */}
              <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
                <div className="flex items-start space-x-3">
                  <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-1">AI Summary</p>
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      {forecast.overall_summary}
                    </p>
                    <p className="text-neutral-500 text-xs mt-2">
                      Day {forecast.days_elapsed} of month &bull; {forecast.days_remaining} days remaining
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Category Forecasts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forecast.forecasts.map((item: BudgetForecastItem) => (
                  <div
                    key={item.category}
                    className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-5 border border-white/10"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <StatusIcon status={item.status} />
                        <span className="text-white font-medium">{item.category}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.status === 'on_track'
                          ? 'bg-green-500/20 text-green-400'
                          : item.status === 'warning'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(item.status)}`}
                        style={{ width: `${Math.min(item.percent_used, 100)}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-neutral-500 text-xs">Spent</p>
                        <p className="text-white font-semibold text-sm">
                          {formatCurrency(item.spent_so_far)}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500 text-xs">Budget</p>
                        <p className="text-neutral-300 font-medium text-sm">
                          {formatCurrency(item.budget_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500 text-xs">Projected</p>
                        <p className={`font-semibold text-sm ${getStatusColor(item.status)}`}>
                          {formatCurrency(item.projected_total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500 text-xs">Used</p>
                        <p className={`font-semibold text-sm ${getStatusColor(item.status)}`}>
                          {Math.round(item.percent_used)}%
                        </p>
                      </div>
                    </div>

                    {/* Projected indicator */}
                    <div className="flex items-center space-x-2 mb-2">
                      {item.projected_total > item.budget_amount ? (
                        <TrendingUp className={`w-4 h-4 ${getStatusColor(item.status)}`} />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-green-400" />
                      )}
                      <span className={`text-xs ${getStatusColor(item.status)}`}>
                        Projected: {Math.round(item.percent_projected)}% of budget by month end
                      </span>
                    </div>

                    {/* Advice */}
                    <div className="bg-white/5 rounded-lg p-3 mt-2">
                      <p className="text-neutral-400 text-xs leading-relaxed">
                        {item.advice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Budget Modal */}
      {showBudgetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-black/90 border border-white/10 rounded-lg shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl text-white mb-4">Add Monthly Budget</h3>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Monthly Limit (INR)
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  min="1"
                  step="1"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {savingBudget ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
