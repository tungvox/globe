from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging
import os
from helpers import summarize_collection
import feedparser

# Set up logging
logging.basicConfig(level=logging.INFO)  # Use INFO for production
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)

# Production CORS configuration
allowed_origins = [
    "https://globe-6d4elgnr0-tungvoxs-projects.vercel.app",  # Your latest Vercel domain
    "https://globe-pi-six.vercel.app",  # Your custom Vercel domain
    "https://globe-jvaox3vb4-tungvoxs-projects.vercel.app",  # Your previous Vercel domain
    "https://globe-d7f6cmn3t-tungvoxs-projects.vercel.app",  # Your old Vercel domain
    "https://globe-1-hduo.onrender.com",  # Your backend domain
    "http://localhost:3000",  # For local development
    "http://localhost:5173",  # For Vite dev server
]

# Add any vercel.app domains dynamically
import os
vercel_url = os.getenv('VERCEL_URL')
if vercel_url:
    allowed_origins.append(f"https://{vercel_url}")

# Add common Vercel domain patterns
vercel_patterns = [
    "https://*.vercel.app",
    "https://*.vercel.app/*"
]

# Add any additional domains from environment
additional_domains = os.getenv('ADDITIONAL_CORS_DOMAINS', '').split(',')
for domain in additional_domains:
    if domain.strip():
        allowed_origins.append(domain.strip())

CORS(app, origins=allowed_origins, supports_credentials=True)

# Production SocketIO configuration
socketio = SocketIO(app, 
    cors_allowed_origins=allowed_origins,
    logger=True,
    engineio_logger=True
)

COPERNICUS_AUTH_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"

# Global variable to store fetched demo data
cached_demo_data = None

def get_copernicus_token():
    username = os.getenv("COPERNICUS_USERNAME")
    password = os.getenv("COPERNICUS_PASSWORD")
    
    if not username or not password:
        logger.error("Copernicus credentials not found in environment variables")
        return None
    
    auth_data = {
        "username": username,
        "password": password,
        "grant_type": "password",
        "client_id": "cdse-public"
    }
    
    try:
        response = requests.post(COPERNICUS_AUTH_URL, data=auth_data, timeout=30)
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            logger.error(f"Authentication failed: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error during authentication: {e}")
        return None

# Health check endpoint for deployment platforms
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()}), 200

def fetch_collections():
    url = "https://maps.terramonitor.com/demouser/stac/collections"
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses
        collections = response.json()  # Parse the JSON response
        return jsonify(collections), 200
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching collections: {e}")
        return jsonify({"error": "Failed to fetch collections"}), 500

@socketio.on('connect')
def handle_connect():
    logger.debug('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    logger.debug('Client disconnected')

@socketio.on('search_satellite')
def handle_satellite_search(data):
    logger.debug(f"Received search request with data: {data}")
    
    token = get_copernicus_token()
    if not token:
        emit('search_error', {"error": "Failed to authenticate with Copernicus"})
        return

    stac_url = "https://catalogue.dataspace.copernicus.eu/stac/search"
    
    search_params = {
        "collections": ["SENTINEL-2"],
        "datetime": f"{data['startDate']}T00:00:00Z/{data['endDate']}T23:59:59Z",
        "bbox": [float(data['lng'])-0.1, float(data['lat'])-0.1, float(data['lng'])+0.1, float(data['lat'])+0.1],
        "filter": {
            "op": "<=",
            "args": [
                {"property": "cloudCover"},
                data.get('cloudCover', 20)
            ]
        }
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    all_results = []
    next_url = stac_url
    
    try:
        while next_url and len(all_results) < 30:
            response = requests.post(next_url, json=search_params, headers=headers)
            if response.status_code == 200:
                result = response.json()
                all_results.extend(result.get('features', []))
                next_url = result.get('links', [{}])[0].get('href') if result.get('links') else None
            else:
                logger.error(f"Search request failed: {response.status_code}")
                break
    except Exception as e:
        logger.error(f"Error during search: {e}")
        emit('search_error', {"error": "Search failed"})
        return

    emit('search_results', {"features": all_results})

@app.route('/fetch_demo_data', methods=['GET'])
def fetch_demo_data():
    global cached_demo_data

    # If data is already cached, return it
    if cached_demo_data is not None:
        logger.debug("Returning cached demo data")
        return jsonify(cached_demo_data), 200

    demo_urls = [
        'https://maps.terramonitor.com/demouser/stac/collections/demo_olenja/items',
        'https://maps.terramonitor.com/demouser/stac/collections/demo_belaya/items',
        'https://maps.terramonitor.com/demouser/stac/collections/demo_dyagilevo/items',
        'https://maps.terramonitor.com/demouser/stac/collections/demo_ivanovo/items'
    ]

    grouped_data = {}

    try:
        for url in demo_urls:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                demo_data = response.json()
                for feature in demo_data.get('features', []):
                    collection = feature.get('collection')
                    if collection not in grouped_data:
                        grouped_data[collection] = []
                    grouped_data[collection].append(feature)
            else:
                logger.error(f"Failed to fetch data from {url}: {response.status_code}")

        # If no external data was fetched, use fallback demo data
        if not grouped_data:
            logger.info("No external demo data available, using fallback data")
            grouped_data = {
                "demo_olenja": [
                    {
                        "type": "Feature",
                        "collection": "demo_olenja",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[37.5, 55.7], [37.6, 55.7], [37.6, 55.8], [37.5, 55.8], [37.5, 55.7]]]
                        },
                        "properties": {
                            "datetime": "2023-01-15T10:30:00Z",
                            "cloudCover": 15,
                            "title": "Demo Olenja Image"
                        }
                    }
                ],
                "demo_belaya": [
                    {
                        "type": "Feature",
                        "collection": "demo_belaya",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[37.4, 55.6], [37.5, 55.6], [37.5, 55.7], [37.4, 55.7], [37.4, 55.6]]]
                        },
                        "properties": {
                            "datetime": "2023-01-16T11:45:00Z",
                            "cloudCover": 25,
                            "title": "Demo Belaya Image"
                        }
                    }
                ]
            }

        # Cache the grouped data
        cached_demo_data = grouped_data
        return jsonify(grouped_data), 200
    except Exception as e:
        logger.error(f"Error fetching demo data: {str(e)}")
        # Return fallback data on error
        fallback_data = {
            "demo_olenja": [
                {
                    "type": "Feature",
                    "collection": "demo_olenja",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[37.5, 55.7], [37.6, 55.7], [37.6, 55.8], [37.5, 55.8], [37.5, 55.7]]]
                    },
                    "properties": {
                        "datetime": "2023-01-15T10:30:00Z",
                        "cloudCover": 15,
                        "title": "Demo Olenja Image"
                    }
                }
            ]
        }
        cached_demo_data = fallback_data
        return jsonify(fallback_data), 200

@app.route('/summary/<collection_name>', methods=['GET'])
def get_collection_summary(collection_name):
    global cached_demo_data

    if cached_demo_data is None:
        return jsonify({"error": "No data available"}), 404

    features = cached_demo_data.get(collection_name)
    if not features:
        return jsonify({"error": f"No data found for collection: {collection_name}"}), 404

    summary = summarize_collection(features)
    return jsonify(summary), 200

@app.route('/collection/<collection_name>', methods=['GET'])
def get_collection_metadata(collection_name):
    """Get collection metadata including spatial extent"""
    global cached_demo_data
    
    try:
        # First try to get from cached demo data (fallback)
        if cached_demo_data and collection_name in cached_demo_data:
            features = cached_demo_data[collection_name]
            if features:
                # Calculate bounding box from the first feature's geometry
                first_feature = features[0]
                if 'geometry' in first_feature and 'coordinates' in first_feature['geometry']:
                    coords = first_feature['geometry']['coordinates'][0]  # First ring of polygon
                    
                    # Calculate bounding box
                    lngs = [coord[0] for coord in coords]
                    lats = [coord[1] for coord in coords]
                    min_lng, max_lng = min(lngs), max(lngs)
                    min_lat, max_lat = min(lats), max(lats)
                    
                    # Create polygon coordinates from bbox
                    polygon_coordinates = [
                        [
                            [min_lng, min_lat],
                            [max_lng, min_lat],
                            [max_lng, max_lat],
                            [min_lng, max_lat],
                            [min_lng, min_lat]  # Close the polygon
                        ]
                    ]
                    
                    return jsonify({
                        'collection_name': collection_name,
                        'title': f'Demo Collection: {collection_name}',
                        'description': f'Demo collection for {collection_name}',
                        'bbox': [min_lng, min_lat, max_lng, max_lat],
                        'polygon_coordinates': polygon_coordinates
                    }), 200
        
        # Fetch from collections catalog
        collections_url = "https://maps.terramonitor.com/demouser/stac/collections"
        response = requests.get(collections_url)
        
        if response.status_code == 200:
            collections_data = response.json()
            
            # Find the specific collection
            for collection in collections_data.get('collections', []):
                if collection.get('id') == collection_name:
                    # Extract spatial extent
                    extent = collection.get('extent', {})
                    spatial = extent.get('spatial', {})
                    bbox = spatial.get('bbox', [])
                    
                    if bbox:
                        # Create polygon coordinates from bbox
                        min_lng, min_lat, max_lng, max_lat = bbox[0]
                        polygon_coordinates = [
                            [
                                [min_lng, min_lat],
                                [max_lng, min_lat],
                                [max_lng, max_lat],
                                [min_lng, max_lat],
                                [min_lng, min_lat]  # Close the polygon
                            ]
                        ]
                        
                        return jsonify({
                            'collection_name': collection_name,
                            'title': collection.get('title', collection_name),
                            'description': collection.get('description', ''),
                            'bbox': bbox[0],
                            'polygon_coordinates': polygon_coordinates
                        }), 200
        
        return jsonify({"error": f"Collection {collection_name} not found"}), 404
        
    except Exception as e:
        logger.error(f"Error fetching collection metadata: {e}")
        return jsonify({"error": "Failed to fetch collection metadata"}), 500

@app.route('/locations/<collection_name>', methods=['GET'])
def get_collection_locations(collection_name):
    """Get location points for a collection"""
    global cached_demo_data
    
    try:
        if cached_demo_data and collection_name in cached_demo_data:
            features = cached_demo_data[collection_name]
            locations = []
            
            for feature in features:
                if 'geometry' in feature and 'coordinates' in feature['geometry']:
                    coords = feature['geometry']['coordinates'][0]  # First ring of polygon
                    
                    # Calculate centroid
                    centroid_lng = sum(coord[0] for coord in coords) / len(coords)
                    centroid_lat = sum(coord[1] for coord in coords) / len(coords)
                    
                    locations.append({
                        'coordinates': [centroid_lng, centroid_lat],
                        'image_count': 1,  # Each feature represents one image
                        'properties': feature.get('properties', {})
                    })
            
            return jsonify({'locations': locations}), 200
        else:
            return jsonify({"error": f"No data found for collection: {collection_name}"}), 404
            
    except Exception as e:
        logger.error(f"Error fetching locations: {e}")
        return jsonify({"error": "Failed to fetch locations"}), 500

@app.route('/google_news', methods=['GET'])
def google_news():
    """Fetch Google News RSS feed"""
    try:
        # Google News RSS feed URL
        rss_url = "https://news.google.com/rss/search?q=satellite+data&hl=en-US&gl=US&ceid=US:en"
        
        # Parse the RSS feed
        feed = feedparser.parse(rss_url)
        
        # Extract news items
        news_items = []
        for entry in feed.entries[:10]:  # Limit to 10 items
            news_items.append({
                'title': entry.title,
                'link': entry.link,
                'published': entry.published,
                'summary': entry.summary if hasattr(entry, 'summary') else ''
            })
        
        return jsonify({'news': news_items}), 200
        
    except Exception as e:
        logger.error(f"Error fetching news: {e}")
        return jsonify({"error": "Failed to fetch news"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False) 