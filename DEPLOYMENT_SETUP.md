# Deployment Setup - Fix Kanboard Buffering

## Problem
After deployment, the kanboard shows buffering because the frontend can't connect to the backend API.

## Solution
Set the environment variable `NEXT_PUBLIC_API_URL` in your hosting platform.

### For Vercel:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your TaskFlow AI Frontend project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://taskflow-backend-p08f.onrender.com/api`
   - **Environments:** Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your project:
   - Go to **Deployments** tab
   - Click the three dots on latest deployment → **Redeploy**
   - Or push a new commit to trigger automatic redeploy

### For Other Hosting Platforms:
Set environment variable:
```
NEXT_PUBLIC_API_URL=https://taskflow-backend-p08f.onrender.com/api
```

## Verify It's Fixed
1. Open your deployed frontend URL
2. Open **DevTools** (F12)
3. Go to **Console** tab
4. Navigate to a project's kanboard
5. You should see tasks loading (no buffering)
6. If still buffering, check console for error messages about API connection

## Configuration Files
- `.env.production` - Local production environment (already configured)
- `vercel.json` - Vercel deployment config (already set)
- `.env.example` - Template for environment variables
