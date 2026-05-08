# Photobooth AI

An advanced, AI-powered AR Photobooth built with **Next.js 16**, **MediaPipe**, and **Tailwind CSS 4**.

## ✨ Features
- **Real-time Face Tracking**: High-performance face mesh detection using MediaPipe.
- **AI Overlays**: Dynamic AR filters and stickers.
- **Integrated Editor**: Adjust layouts, filters, and effects after capture.
- **Local Storage**: Privacy-first session management using browser IndexedDB.
- **Responsive Design**: Optimized for desktop and tablet photobooth setups.

## 🚀 Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Vision**: [MediaPipe Face Mesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
- **Persistence**: IndexedDB
- **Testing**: Vitest

## 🛠️ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Access the app**:
   Open [http://localhost:3000](http://localhost:3000) in your browser. Ensure you grant webcam permissions.

## 📖 Engineering Standards
Refer to [AGENTS.md](./AGENTS.md) for architectural guidelines, folder structures, and coding standards.

## 🧪 Testing
Run unit and integration tests with Vitest:
```bash
npm test
```
