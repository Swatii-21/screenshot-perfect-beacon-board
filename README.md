# LCU & Antenna Monitoring Console

A modern, high-precision telemetry and antenna tracking dashboard built with TanStack Start, React 19, Tailwind CSS v4, and Lovable Cloud.

---

## 🛠️ Tech Stack
- **Framework:** React 19 & TanStack Start v1 (Vite)
- **Styling:** Tailwind CSS v4 & Radix UI
- **Visuals:** Recharts & custom SVG polar radar/compass
- **Backend / Auth:** Lovable Cloud (PostgreSQL & Supabase JS client)

---

## 🚀 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- `npm` or `bun`

### 1. Clone the repository
```bash
git clone <your-github-repo-url>
cd <repo-folder>

### 2. Install dependencies
npm install

### 3. Setup Environment Variables
VITE_SUPABASE_URL="https://nptqwtjkegewmdwzjvqg.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_5L_aSfc7Q09-YGwUWeNiIQ_qwgPLx5E"

### 4. Start Development Server
npm run dev

Development server http://localhost:8080

**Testing & Code Quality**
Unit & component tests: npm run test
Linting: npm run lint
Build production bundle: npm run build

