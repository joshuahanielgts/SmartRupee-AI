import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { listTransactions, Transaction } from '@/services/transactions'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, Calendar, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'react-toastify'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [initialBalance, setInitialBalance] = useState<number>(0)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [balanceInput, setBalanceInput] = useState('')

  useEffect(() => {
    if (user) {
      loadTransactions()
      loadInitialBalance()
    }
  }, [user])

  const loadTransactions = async () => {
    if (!user?.id) return
    try {
      const data = await listTransactions(user.id)
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInitialBalance = () => {
    const saved = localStorage.getItem(`initialBalance_${user?.id}`)
    if (saved) {
      setInitialBalance(parseFloat(saved))
    } else {
      // Show modal if no balance set
      setShowBalanceModal(true)
    }
  }

  const saveInitialBalance = () => {
    const amount = parseFloat(balanceInput)
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount')
      return
    }
    localStorage.setItem(`initialBalance_${user?.id}`, amount.toString())
    setInitialBalance(amount)
    setShowBalanceModal(false)
    toast.success('Initial balance set successfully!')
  }

  const stats = React.useMemo(() => {
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    // Current balance = Initial balance + Income - Expenses
    const balance = initialBalance + income - expenses

    return { income, expenses, balance }
  }, [transactions, initialBalance])

  const categoryData = React.useMemo(() => {
    const categories: Record<string, number> = {}
    transactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const cat = t.category || 'Other'
        categories[cat] = (categories[cat] || 0) + Math.abs(t.amount)
      })
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
  }, [transactions])

  const trendData = React.useMemo(() => {
    const last30Days = transactions
      .filter(t => {
        const daysAgo = Math.floor((Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24))
        return daysAgo <= 30
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const grouped: Record<string, { income: number, expenses: number }> = {}
    last30Days.forEach(t => {
      const date = format(new Date(t.date), 'MMM dd')
      if (!grouped[date]) grouped[date] = { income: 0, expenses: 0 }
      if (t.amount > 0) {
        grouped[date].income += t.amount
      } else {
        grouped[date].expenses += Math.abs(t.amount)
      }
    })

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      income: data.income,
      expenses: data.expenses,
    }))
  }, [transactions])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loader"></span>
      </div>
    )
  }

  return (
    <>
      {/* Initial Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-black/90 backdrop-blur-xl rounded-lg shadow-2xl p-8 border border-white/20 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
              Set Initial Balance
            </h2>
            <p className="text-neutral-400 mb-6">Enter your current bank balance to start tracking your finances</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Initial Balance (₹)
                </label>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter amount"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={saveInitialBalance}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/50"
                >
                  Set Balance
                </button>
                <button
                  onClick={() => {
                    setShowBalanceModal(false)
                    setBalanceInput('0')
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-neutral-300 rounded-lg font-semibold hover:bg-white/10 transition-all"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Dashboard
          </h1>
          <div className="text-sm text-neutral-400 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(), 'MMMM yyyy')}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-400">Total Balance</p>
                  <button
                    onClick={() => {
                      setBalanceInput(initialBalance.toString())
                      setShowBalanceModal(true)
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                    title="Edit initial balance"
                  >
                    <Edit2 className="w-4 h-4 text-neutral-400 hover:text-purple-400" />
                  </button>
                </div>
                <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.balance)}</p>
                {initialBalance > 0 && (
                  <p className="text-xs text-neutral-500 mt-1">Initial: {formatCurrency(initialBalance)}</p>
                )}
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Income</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{formatCurrency(stats.income)}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Expenses</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{formatCurrency(stats.expenses)}</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Expenses by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-neutral-500 py-12">No expense data available</p>
            )}
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Income vs Expenses (30 Days)</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)} 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#d1d5db' }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-neutral-500 py-12">No trend data available</p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-neutral-400 font-medium py-3">Date</th>
                  <th className="text-left text-neutral-400 font-medium py-3">Category</th>
                  <th className="text-left text-neutral-400 font-medium py-3">Note</th>
                  <th className="text-right text-neutral-400 font-medium py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 text-neutral-300">{format(new Date(tx.date), 'MMM dd, yyyy')}</td>
                    <td className="py-3">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        {tx.category || 'Other'}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-400">{tx.note || '-'}</td>
                    <td className={`text-right font-semibold py-3 ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-neutral-500 py-12">
          No transactions yet. Start by adding your first transaction!
        </p>
        )}
      </div>
    </div>
    </>
  )
}