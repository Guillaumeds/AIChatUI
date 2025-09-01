# 🚀 Vercel AI Chatbot Setup Guide

## ✅ What's Installed
You now have the complete **Vercel AI Chatbot** - a production-ready ChatGPT clone with:

- **Next.js 15** + **React 19** (latest versions)
- **AI SDK 5.0.26** with OpenAI/xAI support
- **Zod 3.25.76** for validation
- **TailwindCSS 3.4.1** + shadcn/ui components
- **TypeScript 5.6.3**
- **Authentication** with NextAuth.js
- **Database** support (PostgreSQL)
- **File uploads** with Vercel Blob
- **Code artifacts** and **image generation**

## 🔧 Setup Steps

### 1. Install Dependencies
```bash
npm install
# or if you have pnpm
pnpm install
```

### 2. Configure Environment Variables
Edit `.env.local` with your API keys:

```env
# Required: Generate a secret for authentication
AUTH_SECRET=your-32-character-secret-here

# Required: Choose ONE AI provider
OPENAI_API_KEY=sk-your-openai-key-here
# OR
XAI_API_KEY=your-xai-key-here

# Optional: For file uploads (can skip for basic chat)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Optional: For conversation history (can skip for basic chat)
POSTGRES_URL=your-postgres-connection-string

# Optional: For caching (can skip for basic chat)
REDIS_URL=your-redis-url
```

### 3. Generate AUTH_SECRET
```bash
# Option 1: Use OpenSSL
openssl rand -base64 32

# Option 2: Use online generator
# Visit: https://generate-secret.vercel.app/32
```

### 4. Get API Keys

#### For OpenAI (Recommended):
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to `.env.local` as `OPENAI_API_KEY`

#### For xAI (Alternative):
1. Go to https://console.x.ai/
2. Create an API key
3. Add it to `.env.local` as `XAI_API_KEY`

### 5. Run the Development Server
```bash
npm run dev
```

Visit http://localhost:3000 to see your ChatGPT clone!

## 🎯 Quick Start (Minimal Setup)

For a quick test, you only need:
1. `AUTH_SECRET` (generate with `openssl rand -base64 32`)
2. `OPENAI_API_KEY` (from OpenAI platform)

The app will work without database/blob storage for basic chat functionality.

## 🔄 Switching AI Providers

The app uses xAI by default. To switch to OpenAI:

1. Edit `lib/ai/models.ts`
2. Replace xAI configuration with OpenAI
3. Update your `.env.local` with `OPENAI_API_KEY`

## 📁 Project Structure

- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utilities and configurations
- `hooks/` - Custom React hooks
- `artifacts/` - Code artifact components

## 🚀 Deployment

Deploy to Vercel with one click:
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🎨 Features Included

- ✅ Real-time chat with AI
- ✅ Message history
- ✅ Code syntax highlighting
- ✅ File uploads
- ✅ Image generation
- ✅ Code artifacts
- ✅ Dark/light theme
- ✅ Responsive design
- ✅ Authentication
- ✅ Multiple AI models

## 🔧 Customization

- **Styling**: Edit `app/globals.css` and Tailwind config
- **Components**: Modify files in `components/`
- **AI Models**: Configure in `lib/ai/models.ts`
- **Database**: Schema in `lib/db/schema.ts`

You now have a complete, production-ready ChatGPT clone! 🎉
