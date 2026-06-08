# 🏛️ EMI Tracker AI & Portfolio Management System
## Comprehensive Implementation Report (Frontend focus)

This report provides a detailed breakdown of the architectures, features, and functionalities implemented across the frontend of the **EMI Tracker AI** system.

---

## 🗺️ High-Level System Architecture

The project is built on the **MERN (MongoDB, Express, React, Node.js)** stack. The frontend is a modern, responsive single-page React application powered by Vite, styling via modular vanilla CSS, and connecting to the backend services.

```
                  ┌──────────────────────────────────────────────┐
                  │                 Vite React App               │
                  │  (Dashboard, EMI Calc, Excel Export, Parser)  │
                  └──────┬──────────────────────────────▲────────┘
                         │ REST API                     │ JSON Response
                         ▼                              │
                  ┌──────────────────────────────────────────────┐
                  │           Express / Node.js Server           │
                  │   (Auth, Loan CRUD, Scheduler, Controllers)  │
                  └──────────────────────────────────────────────┘
```

---

## 🎨 Frontend Implementation Details

The frontend is built with React components, custom hooks, and context APIs.

### 📱 Responsive Layout & Design System (`index.css`, `App.jsx`, `Dashboard.jsx`, `EmiCalculator.jsx`)
*   **Grid Overhaul**: Replaced rigid fixed pixel layouts with responsive CSS variables, media queries, and flexbox utilities.
*   **Breakpoints**:
    *   `> 1024px` (Desktop): 4-column metric grid, 2-column main sections (repayment list + visual graphs), horizontal top navigation.
    *   `768px - 1024px` (Tablet): 2-column metric grid, single-column main content.
    *   `≤ 768px` (Mobile): Single-column stacked layouts, touch-friendly tap targets (minimum 44px height), full bottom-sheet modals, and a slide-down mobile nav drawer toggled by a hamburger (`☰` / `✕`) icon.
*   **Theme Integration**: A unified design system utilizing rich HSL color variables (Indigo accents, warning ambers, hazard reds, dark glassmorphism surfaces) with smooth micro-animations.

### 📝 Standalone EMI Calculator (`EmiCalculator.jsx`)
*   **Dual-Input Controls**: Synchronized inputs that support both range sliders (for fast estimation) and numeric manual input fields (for precise currency inputs).
*   **Visual split ratio bar**: A progress bar showing the exact percentage split between the total principal and the cumulative interest over the loan tenure.
*   **Amortization Schedule Generator**: Client-side generation of a month-by-month table detailing remaining principal, monthly interest charges, principal repayment portions, and progressive balance. It includes a sticky first column for seamless horizontal scroll on mobile devices.

### 📋 SMS / UPI / GPay Payment Auto-Detection (`smsParser.js`, `paymentValidator.js`, `Dashboard.jsx`)
*   **Web Clipboard Ingestion**: Leverages the browser Web Clipboard API, allowing users to load SMS transaction snippets with one click, or paste them manually.
*   **Client-Side Regex Parser (`smsParser.js`)**: An instant, local regex parsing engine that identifies:
    *   **Amount**: Extracts values prefixed by `₹`, `Rs`, or `INR`.
    *   **Provider**: Matches against 30+ Indian banking institutions and UPI applications (SBI, HDFC, ICICI, Bajaj, GPay, PhonePe, Paytm, etc.).
    *   **Reference IDs**: Extracts transaction reference codes or UTRs.
    *   **Confidence Scoring**: Automatically assigns a confidence rate based on the completeness of parameters found.
    *   **Loan Proximity Matcher**: Scans the user's active portfolio for matching bank names and EMI amounts to automatically suggest the correct target loan.
*   **Local Stage-2 Validation Fallback (`paymentValidator.js`)**: Runs client-side validation logic if the backend AI services are unreachable, checking for anomalies, deviation margins between expected EMIs and actual payments, and critical security flags.

### 📊 Excel Export Engine (`excelExport.js`, `Dashboard.jsx`, `EmiCalculator.jsx`)
*   **SheetJS (XLSX) Integration**: Pure client-side workbook generation with no heavy server dependencies.
*   **Multi-Sheet Portfolio Workbook (`emi-portfolio-YYYY-MM-DD.xlsx`)**:
    1.  *Sheet 1: Portfolio Summary* — Lists all active loans (principal, interest, tenure, remaining balance, next due date) with a calculated totals row.
    2.  *Sheet 2: Amortization Schedules* — Generates the entire amortization timeline for every loan in the portfolio, formatted with visual headers.
    3.  *Sheet 3: Payment History* — Compiles a history of all payments made, containing dates, amounts, reference IDs, and payment sources.
*   **Single-Schedule Exporter**: Download the amortization matrix directly from the EMI Calculator screen as a single-sheet workbook (`emi-schedule-YYYY-MM-DD.xlsx`).

---

## 🔒 Implemented Security & Privacy Safeguards

The UI includes strict safeguards when handling clipboard content and displaying validations:

*   **Credential Redaction**: Detected OTPs, PINs, or CVVs cause the interface to immediately zero out the parsed amounts and mark the transaction as high-risk, refusing automatic confirmation.
*   **Visual Risk Badging**: Displayed risk alerts (Low/Medium/High) warn users if the source of the message is suspicious, if the transaction matches a phishing template, or if the parsed payment differs from the expected EMI amount.
*   **Actionable Confirmation Guarding**: For high-risk transactions, the button to confirm the payment is disabled entirely, forcing manual bank verification.

---

## 🗂️ Navigation & State Flow

1.  **Auth Routing**: Swaps between Login/Signup forms and caches the session cookie.
2.  **Dashboard**: Main control panel showing visual breakdowns (Charts), EMI payment trackers, Statement Upload widgets, and Telegram sync fields.
3.  **EMI Calculator**: Standalone calculation tab. Users can also click "Send to Calculator" from any active loan card in the dashboard to pre-fill parameters and analyze prepayments or schedules.
