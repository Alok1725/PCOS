# PCOS Wellness Platform

A comprehensive, full-stack web application designed to help users manage and track their Polycystic Ovary Syndrome (PCOS) symptoms, lifestyle, and overall wellness. 

The platform offers personalized insights, symptom tracking, cycle monitoring, community engagement, and AI-driven recommendations tailored to PCOS management.

## 🚀 Technologies Used

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS, Radix UI Primitives, `clsx`, `tailwind-merge`
- **Routing:** React Router DOM
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **File Uploads/Generation:** `react-dropzone`, `jspdf`
- **Networking:** Axios

### Backend (Server)
- **Framework:** Express.js (Node.js)
- **Database / Auth:** Supabase (`@supabase/supabase-js`)
- **AI Integration:** Google Generative AI (`@google/generative-ai`), Groq SDK
- **File Processing:** `multer` (Uploads), `pdf-parse`, `tesseract.js` (OCR)

---

## 💻 Running the Project Locally

### Prerequisites
- Node.js installed on your machine.
- A Supabase account for the database and authentication.
- API keys for Google Gemini and Groq (for AI features).

### 1. Clone the repository
```bash
git clone https://github.com/Alok1725/PCOS.git
cd PCOS
```

### 2. Environment Variables Setup
You will need to create `.env` files in both the `client` and `server` directories based on the components you are touching.
*(Note: Do not commit these files to GitHub)*

**In `server/.env`:**
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

**In `client/.env`:**
```env
VITE_API_BASE=http://localhost:5000
```

### 3. Install Dependencies
Install packages for both the frontend and backend:

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 4. Run the Development Servers
You will need to run the client and server concurrently in two separate terminal windows.

**Start the Server:**
```bash
cd server
npm run dev
# The server will run on http://localhost:5000
```

**Start the Client:**
```bash
cd client
npm run dev
# The client will run on http://localhost:5173 (or similar Vite port)
```

---

## ✨ Key Features
- **Dashboard & Tracking:** Monitor daily symptoms, moods, water intake, and sleep.
- **Cycle Tracking:** Predict and track menstrual cycles specific to PCOS irregularities.
- **AI Health Assistant:** Get personalized insights using Google Gemini and Groq models.
- **Lab Report Analysis:** Upload medical PDFs for OCR extraction and AI-driven summary generation.
- **Community:** Connect with others, share reviews, and participate in a supportive environment.
- **Assessments:** Take quizzes to gauge PCOS severity and receive actionable wellness tips.