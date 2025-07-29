# Globe - Satellite Data Visualization Platform

A React-based web application for visualizing and analyzing satellite data from Copernicus services.

## Features

- Interactive map visualization using Mapbox GL JS
- Real-time satellite data search and analysis
- Cloud cover filtering and statistics
- Location-based data collection and analysis
- WebSocket integration for real-time updates
- Responsive Material-UI interface

## Project Structure

```
globe/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── config.js      # API configuration
│   └── vercel.json        # Vercel deployment config
├── backend/           # Flask backend
│   ├── app.py            # Development server
│   ├── app_production.py # Production server
│   ├── requirements.txt  # Python dependencies
│   └── Procfile         # Heroku deployment
└── vercel.json        # Root deployment config
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Copernicus Data Space Ecosystem credentials

### Local Development

1. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

3. **Environment Variables**
   Create `.env` files in both frontend and backend directories with:
   ```
   COPERNICUS_USERNAME=your_username
   COPERNICUS_PASSWORD=your_password
   ```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel project settings:
   - `REACT_APP_API_URL`: Your backend API URL
   - `REACT_APP_SOCKET_URL`: Your WebSocket server URL
3. Deploy - Vercel will automatically build and deploy

### Backend (Multiple Options)

#### Option 1: Railway (Recommended)
- Easy deployment for Python Flask apps
- Automatic HTTPS and environment variable management

#### Option 2: Heroku
- Traditional choice for Flask apps
- Uses `Procfile` and `app_production.py`

#### Option 3: DigitalOcean App Platform
- Simple deployment with good performance

## Configuration

### Environment Variables

**Frontend (Vercel)**
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_SOCKET_URL`: WebSocket server URL

**Backend**
- `COPERNICUS_USERNAME`: Copernicus Data Space username
- `COPERNICUS_PASSWORD`: Copernicus Data Space password
- `PORT`: Server port (default: 5000)

### CORS Configuration

The backend is configured to allow requests from:
- Local development servers
- Your Vercel domain (update in `app_production.py`)

## Troubleshooting

### Common Issues

1. **404 Errors on Vercel**
   - Check `vercel.json` configuration
   - Verify build command and output directory
   - Ensure environment variables are set

2. **API Connection Issues**
   - Verify backend is running and accessible
   - Check CORS configuration
   - Ensure environment variables are correct

3. **Build Errors**
   - Check all dependencies are in `package.json`
   - Verify build command works locally
   - Check Vercel build logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is licensed under the MIT License.