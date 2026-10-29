# ⚡ PitchArena - Live Pitch & Stall Feedback Frontier

A single full-stack Next.js web application built for live pitch events, demo days, and showcase stalls.

- **Visitor Frontier (`/`)**: Attendees explore stalls, listen to pitches, and submit anonymous multi-criteria ratings with celebratory confetti feedback.
- **Organizer Command Center (`/admin`)**: Single user/password protected dashboard featuring real-time Leaderboards, Top 3 Podiums, Live Feedback Feed, Stall Turnout Analytics, Team Management (CRUD), CSV Export, and Event Reset controls.
- **Dual Database Engine**: Works 100% out of the box with zero configuration using local persistent storage, and connects to **Supabase Cloud Postgres** in 60 seconds by simply adding environment variables!

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Navigate to project directory
cd pitch-arena

# 2. Install dependencies (if not already installed)
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Admin Authentication Credentials

- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Username**: `admin` *(configured via `ADMIN_USERNAME` in `.env.local`)*
- **Password**: `event2026` *(configured via `ADMIN_PASSWORD` in `.env.local`)*

*(A convenient "Fill Default Credentials" button is also present on the login screen for rapid access).*

---

## ☁️ 60-Second Supabase Cloud Database Setup

When you are ready to deploy to the cloud (or run on Supabase Postgres):

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In your Supabase dashboard, click **SQL Editor** on the left menu.
3. Open the `supabase_schema.sql` file in this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
4. In Supabase **Project Settings > API**, copy your **Project URL** and **Anon Key** (or Service Role Key).
5. In `.env.local` (or in your cloud hosting provider's environment variables):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # optional
```

*The application will automatically detect Supabase and switch to Cloud Postgres with real-time updates!*

---

## 🏢 Multi-Stall QR Codes & Simultaneous Operation

Organizers can generate printable or displayable QR codes for each stall:
- Click **"Stall QR Codes"** on the header or inside the Admin portal.
- Select any stall (e.g., `Stall 1`, `Stall 2`, `Stall 3`).
- Attendees scanning the QR code at a booth will automatically arrive at:
  ```
  https://your-domain.vercel.app/?stall=Stall+1
  ```
  The page will instantly highlight the teams pitching at that specific booth.

---

## 🏆 Key Features

- **Multi-Criteria Rating**:
  - 💡 Innovation & Problem Solving (1-5★)
  - 🎤 Presentation & Pitch Clarity (1-5★)
  - 🚀 Real-World Viability & Execution (1-5★)
  - Computed overall score preview & impression badges (`🔥 Game Changer`, `💡 Practical`, etc.).
  - Constructive anonymous feedback notes.
- **Top 3 Podium**:
  - Gold, Silver, and Bronze animated podium cards with real-time score calculation.
- **Live Votes Stream**:
  - Continuous stream of incoming feedback as visitors walk between stalls.
- **Event Team Management**:
  - Add, edit, or delete pitching teams and stall assignments on the fly.
- **Pre-Event Test Reset**:
  - "Clear All Test Votes" button with safety confirmation so organizers can test everything today and reset to 0 before visitors arrive tomorrow.
- **Data Export**:
  - One-click CSV export with full standings and criteria breakdown for judges and award ceremonies.

---

## 📦 Deployment to Vercel

```bash
# Using Vercel CLI
npx vercel
```
Or push to GitHub and import into Vercel with standard Next.js preset.
Add `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Environment Variables in your Vercel Project Settings.
