# Deployment Guide

This project is split into two apps:

- `frontend/` - React + Vite app
- `backend/` - Express + MongoDB API

Recommended setup:

- Backend: Render
- Frontend: Vercel
- Database: MongoDB Atlas

## 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Copy the connection string.
4. Use that string as `MONGO_URI` in the backend environment variables.

## 2. Deploy the backend on Render

1. Create a new Web Service.
2. Connect the repository.
3. Set the root directory to `backend`.
4. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
5. Add environment variables:
   - `PORT` = `10000` or leave Render default
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `RAZORPAY_KEY_ID` = your Razorpay key id
   - `RAZORPAY_KEY_SECRET` = your Razorpay key secret
6. Deploy and copy the public backend URL.

## 3. Deploy the frontend on Vercel

1. Create a new project on Vercel.
2. Connect the repository.
3. Set the root directory to `frontend`.
4. Use these settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add environment variables:
   - `VITE_API_BASE_URL` = your backend URL from Render
6. Deploy the site.

## 4. Verify the app

1. Open the frontend URL.
2. Check that the museum home page loads.
3. Open the chatbot section.
4. Test a question like: `What are the museum timings?`
5. Test the booking flow.
6. If Razorpay is enabled, test the payment flow with test keys first.

## 5. Notes for presentation

- Keep a backup screenshot or screen recording in case the backend takes time to wake up.
- Make sure the backend and frontend environment variables are set before the demo.
- If you change the backend URL later, update `VITE_API_BASE_URL` in Vercel.
