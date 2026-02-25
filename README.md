# SmartRupee AI 🚀

A modern, production-ready personal finance tracker built with React, TypeScript, Tailwind CSS, and Supabase. Track your income and expenses in Indian Rupees (INR) with AI-powered insights from Google Gemini.

## ✨ Features

- 🔐 **Secure Authentication** - Email/password authentication via Supabase Auth
- 💰 **Transaction Management** - Add, view, filter, and export transactions
- � **AI Receipt Scanner** - Drag-and-drop receipt images, parsed by Gemini Vision to auto-fill transactions
- 🧠 **AI Budget Forecaster** - Set monthly budgets and get AI-powered spending trajectory predictions
- 📊 **Interactive Dashboard** - Beautiful charts with Recharts (Pie & Line charts) + AI forecast cards
- 🎨 **Modern UI** - Dark glassmorphism theme with Tailwind CSS + daisyUI + shadcn-style
- ✨ **3D Experience** - Immersive Spline 3D scenes on login and signup pages
- 🔒 **Row Level Security** - Supabase RLS ensures data isolation per user
- 📱 **Responsive Design** - Works perfectly on mobile and desktop
- 🧪 **Type-Safe** - Full TypeScript support with Zod validation
- ♿ **Accessible** - ARIA labels and semantic HTML
- 🚀 **Fast** - Optimized with Vite 5 build tool

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite 5
- **Styling**: Tailwind CSS, daisyUI, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Google Gemini 2.0 Flash (Vision + Text) via Supabase Edge Functions
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Date**: date-fns
- **Export**: CSV export built-in

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
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql` and execute
4. Then run `supabase/schema_upgrade_ai.sql` to add AI feature columns, storage bucket, and indexes

### 4. Run Development Server

```powershell
npm run dev
```

Visit `http://localhost:5173`

## 🗂️ Project Structure

```
Smart-Rupee/
├── components/
│   └── ui/                     # shadcn-style UI components
│       ├── splite.tsx           # 3D Spline component
│       ├── demo.tsx             # Demo scene
│       ├── card.tsx             # Card primitive
│       └── spotlight.tsx        # Spotlight effects
├── src/
│   ├── components/
│   │   ├── Layout.tsx           # Main app layout with navigation
│   │   ├── ProtectedRoute.tsx   # Auth guard wrapper
│   │   ├── ReceiptScanner.tsx   # AI receipt scanner modal (Gemini Vision)
│   │   └── BudgetForecast.tsx   # AI budget forecaster dashboard section
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication state
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── utils.ts             # Helper functions (cn, formatCurrency)
│   ├── pages/
│   │   ├── Login.tsx            # Login page with 3D scene
│   │   ├── Register.tsx         # Registration page
│   │   ├── Dashboard.tsx        # Dashboard with charts + AI forecast
│   │   └── Transactions.tsx     # Transaction management + receipt scanner
│   ├── services/
│   │   ├── transactions.ts      # Transaction CRUD operations
│   │   ├── ai.ts                # AI service (receipt parsing, budget forecast)
│   │   └── budgets.ts           # Budget CRUD operations
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # App entry point
│   └── styles.css               # Global styles + Tailwind
├── functions/
│   └── gemini-proxy/            # Supabase Edge Function for AI
│       └── index.ts             # 3 routes: parse-receipt, forecast-budget, generic
├── supabase/
│   ├── schema.sql               # Base database schema + RLS policies
│   └── schema_upgrade_ai.sql    # AI feature schema (storage, indexes, columns)
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
- Categorize transactions (Food & Dining, Transportation, Shopping, etc.)
- Add notes and dates
- Filter by type (all/income/expense)
- Export to CSV
- Real-time currency formatting in INR
- **AI Receipt Scanner** — scan a receipt photo and auto-fill the transaction form

### AI Receipt Scanner
- Drag-and-drop or click-to-browse image upload
- Supports JPEG, PNG, WebP, HEIC (max 10MB)
- Gemini Vision extracts vendor, total, date, category, and line items
- Preview parsed data with confidence score before saving
- Receipts stored in private Supabase Storage bucket with per-user RLS

### AI Budget Forecaster
- Set monthly budgets per spending category
- AI analyzes last 30 days of spending velocity
- Predicts end-of-month totals per category
- Color-coded status cards: green (on track), yellow (warning), red (over budget)
- Progress bars showing % used and % projected
- Actionable advice per category from Gemini
- Overall financial health summary

### Dashboard
- Total balance, income, expenses stat cards
- Editable initial balance
- Pie chart showing expenses by category
- Line chart showing 30-day income vs expenses trend
- **AI Budget Forecast** section with per-category predictions
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

### Vercel / Netlify

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Supabase Edge Functions (Required for AI features)

```powershell
# Login to Supabase CLI
npx supabase login

# Set Gemini API key as secret
npx supabase secrets set GEMINI_API_KEY=your_gemini_key --project-ref your-project-ref

# Deploy the edge function
npx supabase functions deploy gemini-proxy --project-ref your-project-ref
```

The edge function provides 3 routes:
- `POST /parse-receipt` — Gemini Vision receipt parsing (accepts multipart form upload)
- `POST /forecast-budget` — Gemini Text budget forecasting (queries DB server-side)
- `POST /` — Generic Gemini proxy (fallback)

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
- `file_name` (TEXT)
- `image_url` (TEXT) — Signed URL from Supabase Storage
- `ai_parsed_data` (JSONB) — Gemini Vision parsed result
- `status` (VARCHAR) — `pending` | `parsed`

### Storage: `receipts` bucket
- Private bucket with per-user folder RLS
- Users can only upload/view/delete files in their own `{user_id}/` folder

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
- AI: Google Gemini 2.0 Flash (Vision + Text)

---

**Built with ❤️ for financial wellness in India** 🇮🇳
