## ttrpg-ui

## Auto creation you can skip this ##
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

######                           ######
###### Documentation starts here ######
######                           ######

# Packages needed for the project
nodejs npm (use apt or whatever packagemanager you have to install those packages e.g. apt install nodejs npm)

# Starting the project
npm install
npm run dev

# Structure of the project with how files would look like in the folders

src/
├── assets/                     # Images, icons, static files (e.g., logos, SVGs)
│   └── logo.svg
│
├── services/                   # API calls & backend REST communication
│   ├── api.ts                  # Axios or fetch base instance (base URL, headers)
│   ├── authService.ts          # Authentication endpoints (login, logout)
│   └── characterService.ts     # Character endpoints (get, post, update)
│
├── components/                 # REUSABLE UI COMPONENTS
│   ├── common/                 # Components used across ALL pages (Global UI)
│   │   ├── Button.jsx
│   │   ├── TextInput.jsx
│   │   └── LoadingSpinner.jsx
│   │
│   └── shared/                 # Components shared across SOME pages (e.g., 2+ views)
│       ├── StatCard.jsx        # Used in Overview & Character Details
│       └── CharacterList.jsx   # Used in Overview & PDF Export selection
│
├── layouts/                    # LAYOUT SHELLS (Outer Frames & Outlets)
│   ├── AppLayout.jsx           # Main Shell: Navbar + Sidebar + <Outlet />
│   └── AuthLayout.jsx          # Auth Shell: Clean centered frame (no Navbar)
│
├── features/                   # FEATURE-SPECIFIC COMPONENTS & VIEWS
│   ├── auth/
│   │   ├── LoginPage.jsx       # Route target: /
│   │   └── LoginForm.jsx       # Internal form UI for Login
│   │
│   ├── overview/
│   │   ├── OverviewPage.jsx    # Route target: /overview
│   │   └── QuickStatsPanel.jsx # Sub-component specific only to Overview
│   │
│   ├── character/
│   │   ├── PDFViewPage.jsx     # Route target: /pdfview
│   │   ├── PdfToolbar.jsx      # Sub-component specific only to PDF page
│   │   ├── PdfSidebar.jsx      # Sub-component specific only to PDF page
│   │   └── CharacterPDF.jsx    # @react-pdf/renderer document template
│   │
│   ├── map/
│   │   ├── KonvaPage.jsx       # Route target: /konva
│   │   └── TokenPalette.jsx    # Sub-component specific only to Canvas page
│   │
│   ├── profile/
│   │   └── ProfilePage.jsx     # Route target: /profile
│   │
│   └── admin/
│       └── AdminPage.jsx       # Route target: /admin
│
├── routes/                     # ROUTING CONFIGURATION
│   └── AppRoutes.jsx           # Clean central place for <Routes> tree
│
├── App.jsx                     # Root component wrapper (Providers, Router)
├── main.jsx                    # Vite entry point (Mounts App to index.html)
└── index.css                   # Global CSS / Bootstrap imports

# Naming convention

naming-conventions/
├── folders/                    # Lowercase or kebab-case
│   ├── features/               # Lowercase (e.g., auth/, character/, map/)
│   └── shared/                 # kebab-case (e.g., auth-services/, common-ui/)
│
├── files/                      # Matches component or utility type
│   ├── components/             # PascalCase.jsx (e.g., OverviewPage.jsx, Button.jsx)
│   ├── utilities/              # camelCase.js (e.g., api.js, characterService.js)
│   └── styles/                 # Matches file name (e.g., AppLayout.css, index.css)
│
├── functions/                  # Action-oriented verb naming
│   ├── components/             # PascalCase (e.g., function AppLayout() {})
│   └── helpers/                # camelCase (e.g., fetchCharacters(), handleLogin())
│
└── variables/                  # Data and configuration state
    ├── state/                  # camelCase (e.g., username, isLoading)
    └── constants/              # UPPER_SNAKE_CASE (e.g., BASE_URL, MAX_RETRIES)


# For css is currently both bootstrap and tailwind installed 
