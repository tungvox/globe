# Deployment Guide

## Frontend Deployment (Vercel)

The frontend is configured for Vercel deployment with the following setup:

### Configuration Files
- `vercel.json` - Root configuration for Vercel deployment
- `frontend/vercel.json` - Frontend-specific configuration

### Environment Variables
You'll need to set these environment variables in your Vercel project settings:

1. **REACT_APP_API_URL** - Your backend API URL (e.g., `https://your-backend-domain.com`)
2. **REACT_APP_SOCKET_URL** - Your WebSocket server URL (e.g., `https://your-backend-domain.com`)

### Deployment Steps
1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel project settings
3. Deploy - Vercel will automatically build and deploy your frontend

## Backend Deployment

The backend (Flask app) needs to be deployed separately. Options include:

### Option 1: Railway
- Easy deployment for Python Flask apps
- Automatic HTTPS
- Good for small to medium projects

### Option 2: Heroku
- Traditional choice for Flask apps
- Requires `Procfile` and `requirements.txt`

### Option 3: DigitalOcean App Platform
- Simple deployment
- Good performance

### Option 4: AWS/GCP/Azure
- More control but more complex setup
- Better for production workloads

## Important Notes

1. **CORS Configuration**: Your backend needs to allow requests from your Vercel domain
2. **Environment Variables**: Update the backend to use environment variables for configuration
3. **Database**: If using a database, ensure it's accessible from your deployed backend
4. **WebSocket**: Ensure your WebSocket server supports secure connections (WSS)

## Troubleshooting

### 404 Errors
- Check that your `vercel.json` configuration is correct
- Ensure the build command and output directory are properly set
- Verify that your React app has a proper routing setup

### API Connection Issues
- Verify environment variables are set correctly in Vercel
- Check that your backend is running and accessible
- Ensure CORS is properly configured on your backend

### Build Errors
- Check that all dependencies are in `package.json`
- Verify that the build command works locally
- Check Vercel build logs for specific error messages 