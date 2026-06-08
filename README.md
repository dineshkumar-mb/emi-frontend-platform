# AI-Powered EMI Management & Loan Intelligence Platform - Frontend

This is the interactive frontend application for the AI-Powered EMI Management & Loan Intelligence Platform, built using **React**, **Vite**, and styled with custom UI components.

## 🚀 Key Features

- **Dashboard**: Unified financial view displaying active EMIs, upcoming payments, debt-to-income ratios, and visual data breakdowns.
- **AI Financial Advisor**: Direct conversational interface with a Gemini-powered personal advisor for debt strategy and loan refinancing suggestions.
- **Interactive EMI Calculator**: Real-time amortization schedule viewer with comparison matrices, prepayment analysis, and interactive sliders.
- **Credit Health Tracker**: Graphical progress tracking for credit score estimation, simulator tools, and customized suggestions for improvement.
- **Subcriptions & Expense Tracker**: Detects hidden recurring subscriptions and lists recurring charges alongside regular EMIs.
- **Bank Connectivity**: Interface to connect test accounts/mock SMS feeds to dynamically parse and display incoming transactions.
- **Analytics & Visualizations**: Charts powered by **Recharts** highlighting monthly burn rates, interest-vs-principal splits, and savings predictions.
- **Data Export**: Integrates client-side Excel sheet export (`xlsx`) for detailed offline reporting.

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: React 19 (Vite)
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Data Utilities**: XLSX (Excel export), custom client-side crypto helpers
- **Styling**: Modern, responsive CSS

---

## 📁 Directory Structure

```
frontend-platform/
├── public/              # Favicons, vector graphics, and assets
├── src/
│   ├── assets/          # Static media resources
│   ├── context/         # React Context Providers (e.g. AuthContext)
│   ├── pages/           # Application Pages (Dashboard, AI Advisor, EMI Calc, Credit Health, etc.)
│   ├── utils/           # Client-side utility functions (SMS parser, Payment validators, Excel export)
│   ├── App.css          # App-wide global styles
│   ├── App.jsx          # Main Router & Layout definition
│   ├── index.css        # Core stylesheet
│   └── main.jsx         # React DOM Render entry point
├── Dockerfile           # Docker container configuration
├── nginx.conf           # Production deployment web server configuration
└── vite.config.js       # Vite configuration parameters
```

---

## 💻 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18+ recommended)
- **NPM** (v9+ recommended)

### 1. Installation

Clone the repository and install the dependencies:

```bash
cd frontend-platform
npm install
```

### 2. Configuration

Create a `.env` file in the root directory and add any required API endpoints:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the Development Server

Start the local Vite development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173` (or the port specified by Vite).

---

## 🏗️ Production Deployment

To compile the application to optimized static assets:

```bash
npm run build
```

The output files will be written to the `dist/` directory, which can then be served by Nginx or static file hosting platforms.
