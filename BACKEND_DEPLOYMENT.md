# Backend Deployment Guide (Render)

## Quick Deploy to Render

1. **Go to [Render.com](https://render.com)** and sign up/login

2. **Create New Web Service**
   - Connect your GitHub repository
   - Select the repository
   - Choose "Python" as the runtime

3. **Configure the Service**
   - **Name**: `globe-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app_production.py`

4. **Set Environment Variables**
   - `COPERNICUS_USERNAME`: Your Copernicus username
   - `COPERNICUS_PASSWORD`: Your Copernicus password

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy the generated URL (e.g., `https://globe-backend.onrender.com`)

6. **Update Frontend Environment Variables**
   In your Vercel project settings, set:
   - `REACT_APP_API_URL`: `https://globe-backend.onrender.com`
   - `REACT_APP_SOCKET_URL`: `https://globe-backend.onrender.com`

## Alternative: Railway

1. Go to [Railway.app](https://railway.app)
2. Create new project from GitHub
3. Select the backend directory
4. Add environment variables
5. Deploy

## Alternative: Heroku

1. Install Heroku CLI
2. Run these commands:
   ```bash
   cd backend
   heroku create globe-backend
   heroku config:set COPERNICUS_USERNAME=your_username
   heroku config:set COPERNICUS_PASSWORD=your_password
   git push heroku main
   ```

## Testing the Backend

Once deployed, test these endpoints:
- `https://your-backend-url.com/health` - Should return `{"status": "healthy"}`
- `https://your-backend-url.com/fetch_demo_data` - Should return demo data

## Troubleshooting

- **CORS Errors**: Make sure your Vercel domain is in the CORS origins list
- **Environment Variables**: Double-check that all required variables are set
- **Build Errors**: Check the deployment logs for Python dependency issues 