from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging
import os
from helpers import summarize_collection  # Import the summarize function
import feedparser

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
socketio = SocketIO(app, cors_allowed_origins="*")

COPERNICUS_AUTH_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"

# Global variable to store fetched demo data
cached_demo_data = None

def get_copernicus_token():
    username = os.getenv("COPERNICUS_USERNAME")
    password = os.getenv("COPERNICUS_PASSWORD")
    
    logger.debug(f"Attempting to authenticate with Copernicus - Username present: {'Yes' if username else 'No'}")
    
    auth_data = {
        "username": username,
        "password": password,
        "grant_type": "password",
        "client_id": "cdse-public"
    }
    
    response = requests.post(COPERNICUS_AUTH_URL, data=auth_data)
    logger.debug(f"Copernicus auth response status: {response.status_code}")
    
    if response.status_code == 200:
        return response.json()["access_token"]
    logger.error(f"Authentication failed: {response.text}")
    return None

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
            response_data = response.json()
            all_results.extend(response_data.get('features', []))
            
            # Check for the next link
            next_url = None
            for link in response_data.get('links', []):
                if link.get('rel') == 'next':
                    next_url = link.get('href')
                    break
        
        # Limit the results to 30
        emit('search_results', {"features": all_results[:30]})
    except Exception as e:
        logger.error(f"Error during search: {str(e)}")
        emit('search_error', {"error": str(e)})

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
            response = requests.get(url)
            if response.status_code == 200:
                demo_data = response.json()
                for feature in demo_data.get('features', []):
                    collection = feature.get('collection')
                    if collection not in grouped_data:
                        grouped_data[collection] = []
                    grouped_data[collection].append(feature)
            else:
                logger.error(f"Failed to fetch data from {url}: {response.status_code}")

        # Cache the grouped data
        cached_demo_data = grouped_data
        return jsonify(grouped_data), 200
    except Exception as e:
        logger.error(f"Error fetching demo data: {str(e)}")
        return jsonify({"error": "Failed to fetch demo data"}), 500

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
                    
                    if bbox and len(bbox) > 0:
                        # Convert bbox to polygon coordinates
                        # bbox format: [min_lng, min_lat, max_lng, max_lat]
                        min_lng, min_lat, max_lng, max_lat = bbox[0]
                        
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
                            'title': collection.get('title', ''),
                            'description': collection.get('description', ''),
                            'bbox': bbox[0],
                            'polygon_coordinates': polygon_coordinates
                        }), 200
                    else:
                        return jsonify({"error": f"No spatial extent found for collection: {collection_name}"}), 404
            
            # Collection not found in catalog
            return jsonify({"error": f"Collection not found: {collection_name}"}), 404
        else:
            return jsonify({"error": f"Failed to fetch collections catalog"}), 404
            
    except Exception as e:
        logger.error(f"Error fetching collection metadata: {str(e)}")
        return jsonify({"error": "Failed to fetch collection metadata"}), 500

@app.route('/locations/<collection_name>', methods=['GET'])
def get_collection_locations(collection_name):
    """Get location points for a collection"""
    global cached_demo_data
    
    try:
        if cached_demo_data is None:
            return jsonify({"error": "No data available"}), 404

        features = cached_demo_data.get(collection_name)
        if not features:
            return jsonify({"error": f"No data found for collection: {collection_name}"}), 404

        # Get the summary which includes location data
        summary = summarize_collection(features)
        
        # Extract location points
        locations = []
        for location in summary.get('multi_image_locations', []):
            locations.append({
                'id': location['location_id'],
                'coordinates': location['coordinates'],
                'image_count': location['image_count'],
                'date_range': location['date_range'],
                'constellations': location['constellations'],
                'sensor_types': location['sensor_types']
            })
        
        return jsonify({
            'collection_name': collection_name,
            'total_locations': len(locations),
            'locations': locations
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching collection locations: {str(e)}")
        return jsonify({"error": "Failed to fetch collection locations"}), 500

@app.route('/google_news', methods=['GET'])
def google_news():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'Missing query parameter q'}), 400
    # Google News RSS URL
    rss_url = f'https://news.google.com/rss/search?q={requests.utils.quote(query)}&hl=en-US&gl=US&ceid=US:en'
    try:
        resp = requests.get(rss_url, timeout=10)
        if resp.status_code != 200:
            return jsonify({'error': 'Failed to fetch Google News RSS'}), 502
        feed = feedparser.parse(resp.content)
        articles = []
        for entry in feed.entries:
            articles.append({
                'title': entry.get('title', ''),
                'link': entry.get('link', ''),
                'published': entry.get('published', ''),
                'summary': entry.get('summary', ''),
                'source': entry.get('source', {}).get('title', '') if entry.get('source') else ''
            })
        return jsonify({'articles': articles})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    socketio.run(app, debug=True)
