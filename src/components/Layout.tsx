import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Wallet, LayoutDashboard, Receipt, LogOut } from 'lucide-react'
import { toast } from 'react-toastify'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      
      <nav className="relative z-10 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center space-x-2 text-white hover:text-purple-400 transition">
              <Wallet className="w-6 h-6" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                SmartRupee AI
              </span>
            </Link>
            
            <div className="flex items-center space-x-1">
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-2 px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/transactions" 
                className="flex items-center space-x-2 px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                <Receipt className="w-5 h-5" />
                <span>Transactions</span>
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-neutral-300 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="relative z-10 container mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
