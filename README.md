# SmartRupee AI 🚀

A modern, production-ready personal finance tracker built with React, TypeScript, Tailwind CSS, and Supabase. Track your income and expenses in Indian Rupees (INR) with AI-powered insights from Google Gemini.

## ✨ Features

- 🔐 **Secure Authentication** - Email/password authentication via Supabase Auth
- 💰 **Transaction Management** - Add, view, filter, and export transactions
- 📊 **Interactive Dashboard** - Beautiful charts with Recharts (Pie & Line charts)
- 🎨 **Modern UI** - Built with Tailwind CSS + daisyUI components + shadcn-style
- ✨ **3D Experience** - Immersive Spline 3D scenes on login and signup pages
- 🔒 **Row Level Security** - Supabase RLS ensures data isolation
- 📱 **Responsive Design** - Works perfectly on mobile and desktop
- 🧪 **Type-Safe** - Full TypeScript support
- ♿ **Accessible** - ARIA labels and semantic HTML
- 🚀 **Fast** - Optimized with Vite build tool

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, daisyUI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)

## 📦 Installation

### 1. Clone and Install

```powershell
cd d:\Projects\Smart-Rupee
npm install
```

### 2. Environment Setup

Copy the example environment file:

```powershell
copy .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://duzfeqhysnlnxstgkkna.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Execute the SQL to create tables and RLS policies

### 4. Run Development Server

```powershell
npm run dev
```

Visit `http://localhost:5173`

## 🗂️ Project Structure

```
Smart-Rupee/
├── components/
│   └── ui/               # shadcn-style UI components
│       ├── splite.tsx    # 3D Spline component
│       ├── demo.tsx      # Demo scene
│       ├── card.tsx      # Card primitive
│       └── spotlight.tsx # Spotlight effects
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main app layout with navigation
│   │   └── ProtectedRoute.tsx  # Auth guard wrapper
│   ├── context/
│   │   └── AuthContext.tsx     # Authentication state
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # Helper functions (cn, formatCurrency)
│   ├── pages/
│   │   ├── Login.tsx           # Login page with 3D scene
│   │   ├── Register.tsx        # Registration page
│   │   ├── Dashboard.tsx       # Dashboard with charts
│   │   └── Transactions.tsx    # Transaction management
│   ├── services/
│   │   └── transactions.ts     # Transaction CRUD operations
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # App entry point
│   └── styles.css              # Global styles + Tailwind
├── functions/
│   └── gemini-proxy/           # Supabase Edge Function for AI
├── supabase/
│   └── schema.sql              # Database schema + RLS policies
└── package.json
```

## 🎯 Key Features Explained

### Authentication
- Supabase Auth with email/password
- Protected routes with redirect to login
- Automatic session management
- 3D Spline scenes on login and registration pages

### Transactions
- Add income/expense transactions
- Categorize transactions
- Add notes and dates
- Filter by type (all/income/expense)
- Export to CSV
- Real-time currency formatting in INR

### Dashboard
- Total balance, income, expenses cards
- Pie chart showing expenses by category
- Line chart showing 30-day income vs expenses trend
- Recent transactions table
- Responsive grid layout

### UI Components
- shadcn-style component architecture under `/components/ui`
- 3D Spline scenes on login and registration pages (lazy-loaded)
- Consistent card borders with border-base-300 for clean aesthetic
- daisyUI theming with light/dark mode toggle
- Lucide React icons throughout
- Toast notifications for user feedback

## 🔒 Security

- **Row Level Security (RLS)**: Users can only access their own data
- **API Keys**: Gemini API key stored in Supabase Edge Function secrets (never exposed to client)
- **Authentication**: Supabase handles secure session management
- **SQL Injection**: Protected by Supabase client's parameterized queries

## 🚀 Deployment

### Netlify - https://smartrupee-ai.netlify.app/

### Supabase Edge Functions (Optional - for AI features)

```powershell
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Set secret
supabase secrets set GEMINI_API_KEY=your_gemini_key

# Deploy function
supabase functions deploy gemini-proxy
```

## 🧪 Testing

```powershell
# Run tests
npm run test

# Type check
npm run typecheck

# Build for production
npm run build
```

## 📝 Database Schema

### transactions
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `amount` (DECIMAL) - Positive for income, negative for expense
- `currency` (VARCHAR) - Default 'INR'
- `category` (VARCHAR)
- `note` (TEXT)
- `date` (DATE)
- `created_at`, `updated_at` (TIMESTAMP)

### budgets
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `category` (VARCHAR)
- `amount` (DECIMAL)
- `period` (VARCHAR) - 'monthly', 'yearly'

### receipts
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `transaction_id` (UUID, FK)
- `file_path` (TEXT)
- `ai_parsed_data` (JSONB)

## 🎨 shadcn Components

This project uses the shadcn component structure:
- Components live in `/components/ui`
- Consistent with shadcn CLI conventions
- Easy to add more primitives using `npx shadcn-ui@latest add <component>`

**Why `/components/ui`?**
- Industry standard for UI component libraries
- Clear separation between UI primitives and app components
- Compatible with shadcn CLI tooling
- Makes imports predictable: `@/components/ui/card`

## 🤝 Contributing

This is a personal finance tracker. Feel free to fork and customize for your needs!

## 📄 License

MIT License - feel free to use this project as a template.

## 🙏 Credits

- UI Components: Inspired by shadcn/ui
- 3D Scenes: Powered by Spline
- Icons: Lucide React
- Backend: Supabase
- AI: Google Gemini

---

**Built with ❤️ for financial wellness in India** 🇮🇳
