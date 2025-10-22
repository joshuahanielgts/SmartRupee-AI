import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { listTransactions, createTransaction, Transaction } from '@/services/transactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { Plus, Filter, Download } from 'lucide-react'
import { format } from 'date-fns'

const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
    message: 'Amount must be a non-zero number',
  }),
  category: z.string().min(1, 'Category is required'),
  note: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['income', 'expense']),
})

type TransactionFormData = z.infer<typeof transactionSchema>

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Salary',
  'Freelance',
  'Investment',
  'Other',
]

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense',
    },
  })

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user])

  const loadTransactions = async () => {
    if (!user?.id) return
    try {
      const data = await listTransactions(user.id)
      setTransactions(data)
    } catch (error) {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const amount = data.type === 'expense' ? -Math.abs(Number(data.amount)) : Math.abs(Number(data.amount))
      await createTransaction({
        user_id: user?.id,
        amount,
        currency: 'INR',
        category: data.category,
        note: data.note,
        date: data.date,
      })
      toast.success('Transaction added successfully!')
      setShowModal(false)
      reset()
      loadTransactions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add transaction')
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true
    if (filter === 'income') return tx.amount > 0
    if (filter === 'expense') return tx.amount < 0
    return true
  })

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Category', 'Note', 'Amount'],
      ...filteredTransactions.map((tx) => [
        format(new Date(tx.date), 'yyyy-MM-dd'),
        tx.category || '',
        tx.note || '',
        tx.amount.toString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Transactions exported!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loader"></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          Transactions
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center space-x-2"
            aria-label="Add new transaction"
          >
            <Plus className="w-5 h-5" />
            <span>Add Transaction</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition flex items-center"
            aria-label="Export transactions"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">Filter:</span>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
              }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'income' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
              }`}
              onClick={() => setFilter('income')}
            >
              Income
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'expense' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
              }`}
              onClick={() => setFilter('expense')}
            >
              Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-black/40 backdrop-blur-xl rounded-lg shadow-2xl p-6 border border-white/10">
        {filteredTransactions.length > 0 ? (
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
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 text-neutral-300">{formatDate(tx.date)}</td>
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
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">No transactions found</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
            >
              Add Your First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-black/90 border border-white/10 rounded-lg shadow-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-2xl text-white mb-6">Add Transaction</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Type
                </label>
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" {...register('type')}>
                  <option value="expense" className="bg-gray-900">Expense</option>
                  <option value="income" className="bg-gray-900">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Amount (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  {...register('amount')}
                  aria-label="Transaction amount"
                />
                {errors.amount && (
                  <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Category
                </label>
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" {...register('category')}>
                  <option value="" className="bg-gray-900">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-900">
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  {...register('date')}
                  aria-label="Transaction date"
                />
                {errors.date && (
                  <p className="text-red-400 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Add a note..."
                  rows={3}
                  {...register('note')}
                  aria-label="Transaction note"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                  onClick={() => {
                    setShowModal(false)
                    reset()
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition">
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
