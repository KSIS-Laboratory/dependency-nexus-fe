# Dependency Nexus - Frontend

Next.js 16 frontend for Dependency Nexus with GitHub App authentication, advanced visualizations, and AI-powered analysis.

## Features

- **GitHub App Authentication** - OAuth 2.0 with fine-grained permissions and automatic token refresh.
- **AI Chatbot Assistant** - Interactive RAG-based chatbot (`ChatbotWidget`) that understands your repository context.
- **Advanced Visualizations**:
  - **Knowledge Graph** - Force-directed graph showing dependencies and their relationships.
  - **Hierarchical Edge Bundling** - Circular layout to visualize complex inter-dependencies.
  - **Collapsible Tree** - Interactive tree view for exploring dependency hierarchies.
  - **Security Heatmap** - Visual representation of vulnerability density across repositories.
  - **Trend Analysis** - Historical tracking of vulnerability metrics over time.
- **Vulnerability Dashboard** - Comprehensive view of security risks, severity distribution, and remediation guides.
- **Scan History** - Track and compare scan results over time.
- **Multi-Repository Support** - Seamlessly switch and compare different repositories.
- **Modern UI** - Built with **DaisyUI 5** and **Tailwind CSS 4**, featuring full dark mode and theme switching support.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, DaisyUI 5
- **Visualization**: D3.js, Recharts (if used in TrendAnalysis), React Force Graph
- **Animation**: Framer Motion, Lottie React
- **Icons**: Lucide React
- **State Management**: React Hooks

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your backend API URL.

3. **Run the development server:**
   ```bash
   bun dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── auth/
│   └── callback/      # OAuth callback handler
├── dashboard/         # Main dashboard overview
├── repositories/      # Repository list and details
├── visualization/     # Advanced graph visualizations
├── layout.tsx         # Root layout with providers
└── page.tsx           # Landing/Login page

components/
├── visualization/     # Graph components (KnowledgeGraph, Heatmap, etc.)
├── chatbot/           # Chatbot widget and related components
├── dashboard/         # Dashboard widgets (Stats, Trends, etc.)
├── ChatbotWidget.tsx  # Main AI assistant component
├── KnowledgeGraph.tsx # Force-directed dependency graph
├── SecurityHeatmap.tsx # Vulnerability density heatmap
├── TrendAnalysis.tsx  # Vulnerability trend charts
└── ...

lib/
├── auth.ts            # Authentication service
├── chatbot.ts         # Chatbot API integration
├── graph-queries.ts   # Neo4j/Graph data fetching
└── utils.ts           # Utility functions
```

## Routes

- `/` - Login page
- `/dashboard` - Main overview
- `/repositories` - Repository management
- `/repositories/[owner]/[repo]` - Single repository details
- `/visualization` - Advanced dependency visualizations

## Authentication Flow

1. User clicks "Continue with GitHub".
2. Redirects to Backend -> GitHub for authorization.
3. Callback exchanges code for **access + refresh tokens**.
4. Tokens stored securely with automatic expiration handling.
5. **Auto-refresh** mechanism ensures seamless session continuity.

## Documentation

For complete OAuth setup instructions, see [OAUTH_SETUP.md](../OAUTH_SETUP.md).
