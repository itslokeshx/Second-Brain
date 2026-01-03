# 🚀 Production Deployment Guide

This guide will walk you through deploying Second Brain to production.

## 📋 Prerequisites

- [ ] GitHub account (to connect repositories)
- [ ] MongoDB Atlas account (free tier available)
- [ ] Render account (free tier available)
- [ ] Vercel account (free tier available)

---

## Step 1: Create MongoDB Atlas Database (5 minutes)

1. **Sign up for MongoDB Atlas**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Create a free account (no credit card required)

2. **Create a Free Cluster**
   - Click "Build a Database"
   - Select "M0 FREE" tier
   - Choose a cloud provider and region (any will work)
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username: `secondbrain`
   - Set password: (generate a strong password and save it)
   - User Privileges: "Atlas admin"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://secondbrain:<password>@cluster0.xxxxx.mongodb.net/`)
   - Replace `<password>` with your actual password
   - Add database name at the end: `mongodb+srv://secondbrain:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/second-brain`
   - **Save this connection string - you'll need it for Render**

---

## Step 2: Deploy Backend to Render (10 minutes)

1. **Push Code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Sign up for Render**
   - Go to https://dashboard.render.com/
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Click "Connect account" to link your GitHub
   - Find and select your `Second-Brain` repository
   - Click "Connect"

4. **Configure Web Service**
   - **Name**: `second-brain-backend` (or any name you prefer)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1 |
   | `SESSION_SECRET` | Click "Generate" to auto-generate |
   | `FRONTEND_URL` | `https://second-brain-hub.vercel.app` (we'll update this later) |
   | `ALLOWED_ORIGINS` | `https://second-brain-hub.vercel.app` (we'll update this later) |

6. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Once deployed, you'll see a URL like: `https://second-brain-backend-xxxxx.onrender.com`
   - **Copy this URL - you'll need it for the frontend**

7. **Test Backend**
   - Visit: `https://YOUR-BACKEND-URL.onrender.com/health`
   - You should see: `{"status":"ok","timestamp":"...","uptime":...}`
   - ✅ If you see this, your backend is working!

---

## Step 3: Update Frontend Configuration (2 minutes)

1. **Update Backend URL in config.js**
   
   Open `js/config.js` and update line 16 with your actual Render URL:

   ```javascript
   if (!this.isDevelopment) {
       return 'https://YOUR-ACTUAL-RENDER-URL.onrender.com'; // Replace with your URL
   }
   ```

2. **Commit Changes**
   ```bash
   git add js/config.js
   git commit -m "Update production backend URL"
   git push origin main
   ```

---

## Step 4: Deploy Frontend to Vercel (5 minutes)

1. **Sign up for Vercel**
   - Go to https://vercel.com/signup
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Find and select your `Second-Brain` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: Leave empty

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Once deployed, you'll see a URL like: `https://second-brain-xxxxx.vercel.app`
   - **This is your production app URL!**

5. **Test Frontend**
   - Visit your Vercel URL
   - You should see the login page
   - ✅ If you see the login page, your frontend is deployed!

---

## Step 5: Update CORS Settings (3 minutes)

Now that you have your Vercel URL, update the backend to allow requests from it:

1. **Go to Render Dashboard**
   - Navigate to your `second-brain-backend` service
   - Click "Environment" in the left sidebar

2. **Update Environment Variables**
   - Find `FRONTEND_URL` and update to your Vercel URL
   - Find `ALLOWED_ORIGINS` and update to your Vercel URL
   - Example: `https://second-brain-xxxxx.vercel.app`

3. **Redeploy Backend**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait 2-3 minutes for redeployment

---

## Step 6: Test Your Production App! 🎉

1. **Visit Your Vercel URL**
   - Open your production app: `https://second-brain-xxxxx.vercel.app`

2. **Register a New Account**
   - Click "Register"
   - Enter email and password
   - Click "Register"
   - ✅ You should be logged in!

3. **Test Core Features**
   - Create a new project
   - Add some tasks
   - Start a pomodoro timer
   - Click the sync button (top right)
   - Reload the page
   - ✅ Your data should persist!

4. **Verify Data in MongoDB**
   - Go to MongoDB Atlas dashboard
   - Click "Browse Collections"
   - You should see `projects`, `tasks`, `pomodoros`, `users` collections
   - ✅ Your data is being saved!

---

## 🎊 Congratulations!

Your Second Brain app is now live in production!

### Your Production URLs:
- **Frontend**: `https://second-brain-xxxxx.vercel.app`
- **Backend**: `https://second-brain-backend-xxxxx.onrender.com`
- **Database**: MongoDB Atlas

---

## 🔧 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify `MONGODB_URI` is correct
- Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0

### Frontend shows CORS errors
- Verify `ALLOWED_ORIGINS` in Render matches your Vercel URL exactly
- Redeploy backend after changing environment variables

### Login doesn't work
- Check browser console for errors
- Verify backend URL in `config.js` is correct
- Test backend health endpoint

### Data doesn't sync
- Check Render logs during sync
- Verify MongoDB connection string is correct
- Ensure you're logged in

---

## 📝 Next Steps

### Optional Improvements:
1. **Custom Domain** (Vercel)
   - Add your own domain in Vercel settings
   - Update CORS in Render with new domain

2. **Monitoring**
   - Set up UptimeRobot to ping your backend every 5 minutes (prevents Render free tier from sleeping)
   - Add error tracking with Sentry

3. **Performance**
   - Enable Vercel Analytics
   - Add service worker for offline support

---

## 🆘 Need Help?

If you run into issues:
1. Check Render logs (Dashboard → Logs)
2. Check browser console (F12 → Console)
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas is accessible

---

**Deployment Date**: January 2026  
**Stack**: Node.js + Express + MongoDB + Vanilla JS  
**Hosting**: Render (Backend) + Vercel (Frontend)
