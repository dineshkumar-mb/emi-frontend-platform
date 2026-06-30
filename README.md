# AI-Powered EMI Calculator - Frontend

A React-based user interface for managing EMI schedules and interacting with an AI financial advisor.

## 🚀 What Was Built

A React.js application that provides users with a dashboard to view their EMI schedules, track payments, and chat with an AI advisor. It connects to a Node.js backend to display data persisted in MongoDB and render AI-generated financial insights.

## 💡 Why It's Technically Interesting

The frontend integrates a conversational UI with structured financial data visualization. It seamlessly handles displaying complex numerical data (like EMI breakdowns and repayment schedules) alongside natural language advice, ensuring a unified and responsive user experience.

## 🛠️ Architecture

- **Frontend Stack:** React.js, Vite.
- **Hosting:** Vercel (Live Demo: https://emi-frontend-platform.vercel.app/).
- **API Integration:** REST API calls to the Node.js backend to fetch EMI schedules, submit documents for RAG indexing, and query the AI advisor.

## The Prompt / Data Structure

While the AI prompt engineering lives on the backend, the frontend is designed to parse and render the structured JSON responses returned by the AI. It dynamically formats action items (like recommended loan filters or repayment plans) into interactive UI components, rather than just displaying raw text.

## Response Validation & Error Handling

The UI implements resilient error handling for AI responses. If the backend returns a `no_match` fallback status or the AI service is unavailable, the frontend safely catches these errors and displays graceful fallback disclaimers to the user (e.g., indicating that the query is being answered from general knowledge rather than uploaded documents).

## Getting Started

### Prerequisites
- Node.js v22

### Installation

```bash
git clone https://github.com/dineshkumar-mb/emi-frontend-platform
cd emi-frontend-platform
npm install
```

### Running the App

```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the following required key:
- `VITE_API_BASE_URL` (or equivalent backend URL variable)

## License

MIT License
