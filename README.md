# SamkoCentral UK

A modern Next.js 15 enterprise facilities, operations & statutory compliance management platform for UK hotel properties. Built with TypeScript and Tailwind CSS.

## 🚀 Features

- **Next.js 15 App Router** - High-performance SSR and client components
- **React 19** - State-of-the-art UI with responsive dark/gold enterprise aesthetic
- **Tailwind CSS** - Complete styling system with CSS variables and custom components
- **Multi-Role RBAC** - Super Admin (L1), Admin (L2), Uploader (L3), Viewer (L4)
- **Live Alarms & IoT Telemetry** - Dynamic real-time alerts across all UK properties

## 🛠️ Installation

1. Install dependencies:
  ```bash
  npm install
  ```

2. Start the development server:
  ```bash
  npm run dev
  ```
3. Open [http://localhost:4028](http://localhost:4028) with your browser.

## 📁 Project Structure

```
samkocentral/
├── public/             # Static assets & brand logos
├── src/
│   ├── app/            # App router modules (Dashboard, Assets, Maintenance, Compliance, Users, Settings)
│   ├── components/     # Topbar, Sidebar, UI modals, CMS Sequencer
│   ├── lib/            # Auth, CMS store, Notifications, Permissions, APIs
│   └── styles/         # Global styles and Tailwind configuration
├── next.config.mjs     # Next.js configuration
├── package.json        # Project dependencies and scripts
└── tailwind.config.js  # Tailwind CSS configuration
```

## 📦 Available Scripts

- `npm run dev` - Start development server on port 4028
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript compiler check
