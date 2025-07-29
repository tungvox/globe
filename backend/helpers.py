import logging
from datetime import datetime, timedelta, timezone
from collections import defaultdict

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def summarize_collection(features):
    summary = {
        "total_features": len(features),
        "average_cloud_cover": 0,
        "average_resolution": 0,
        "constellations": set(),
        "sensor_types": set(),
        "features_per_year": {},
        "features_last_30_days": 0,
        "high_resolution": 0,
        "very_high_resolution": 0,
        "first_image_coordinates": None,
        # New fields for multiple images analysis
        "unique_locations": 0,
        "locations_with_multiple_images": 0,
        "temporal_coverage": {},
        "multi_image_locations": [],
        "date_range": {},
        "constellation_coverage": {},
        "sensor_coverage": {}
    }

    if not features:
        return summary

    total_cloud_cover = 0
    total_resolution = 0
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Track coordinates for spatial analysis
    coordinate_groups = defaultdict(list)
    dates = []
    constellation_counts = defaultdict(int)
    sensor_counts = defaultdict(int)

    for index, feature in enumerate(features):
        properties = feature.get('properties', {})
        datetime_str = properties.get('datetime')
        feature_date = datetime.fromisoformat(datetime_str.replace('Z', '+00:00')) if datetime_str else None

        # Update cloud cover and resolution
        total_cloud_cover += properties.get('cloud_cover', 0)
        total_resolution += properties.get('resolution', 0)

        # Update constellations and sensor types
        constellation = properties.get('constellation', 'unknown')
        sensor_type = properties.get('sensor_type', 'unknown')
        summary["constellations"].add(constellation)
        summary["sensor_types"].add(sensor_type)
        
        # Count constellations and sensors
        constellation_counts[constellation] += 1
        sensor_counts[sensor_type] += 1

        # Track dates for temporal analysis
        if datetime_str:
            dates.append(datetime_str)

        # Count features per year and per month
        if feature_date:
            year = feature_date.year
            month = feature_date.month

            # Initialize the year in features_per_year if not present
            if year not in summary["features_per_year"]:
                summary["features_per_year"][year] = {}

            # Count features per month within the year
            summary["features_per_year"][year][month] = summary["features_per_year"][year].get(month, 0) + 1

            # Count features in the last 30 days
            if feature_date >= thirty_days_ago:
                summary["features_last_30_days"] += 1

        # Categorize by resolution
        resolution = properties.get('resolution', float('inf'))
        if resolution <= 1:
            summary["very_high_resolution"] += 1
        elif resolution <= 5:
            summary["high_resolution"] += 1

        # Get coordinates of the first image
        if index == 0:
            geometry = feature.get('geometry', {})
            summary["first_image_coordinates"] = geometry.get('coordinates')
        
        # Group by coordinates for spatial analysis
        geometry = feature.get('geometry', {})
        if geometry and 'coordinates' in geometry:
            coords = geometry['coordinates']
            if coords:
                # Convert to string for grouping
                import json
                coord_str = json.dumps(coords, sort_keys=True)
                coordinate_groups[coord_str].append({
                    'id': feature.get('id', f'Image_{index}'),
                    'date': datetime_str,
                    'constellation': constellation,
                    'sensor_type': sensor_type,
                    'cloud_cover': properties.get('cloud_cover', 0),
                    'resolution': properties.get('resolution', 0)
                })

    # Calculate spatial analysis
    summary["unique_locations"] = len(coordinate_groups)
    summary["locations_with_multiple_images"] = sum(1 for group in coordinate_groups.values() if len(group) > 1)
    
    # Find ALL locations (including single-image locations)
    for coord_str, images in coordinate_groups.items():
        # Parse the coordinates back to get the actual coordinates
        import json
        coords = json.loads(coord_str)
        
        # Calculate centroid of the polygon for the point location
        if coords and len(coords) > 0 and len(coords[0]) > 0:
            # Calculate centroid of the first ring of the polygon
            lngs = [point[0] for point in coords[0]]
            lats = [point[1] for point in coords[0]]
            centroid_lng = sum(lngs) / len(lngs)
            centroid_lat = sum(lats) / len(lats)
            
            summary["multi_image_locations"].append({
                'location_id': f"Location_{len(summary['multi_image_locations']) + 1}",
                'coordinates': [centroid_lng, centroid_lat],  # Centroid coordinates
                'polygon_coordinates': coords,  # Full polygon coordinates
                'image_count': len(images),
                'date_range': {
                    'earliest': min(img['date'] for img in images if img['date']),
                    'latest': max(img['date'] for img in images if img['date'])
                } if len(images) > 0 and any(img['date'] for img in images) else None,
                'constellations': list(set(img['constellation'] for img in images)),
                'sensor_types': list(set(img['sensor_type'] for img in images)),
                'sample_images': images[:3]  # Show first 3 images
            })

    # Temporal analysis
    if dates:
        summary["date_range"] = {
            'earliest': min(dates),
            'latest': max(dates),
            'total_days': len(set(dates)),
            'date_span_days': (datetime.fromisoformat(max(dates).replace('Z', '+00:00')) - 
                              datetime.fromisoformat(min(dates).replace('Z', '+00:00'))).days
        }

    # Constellation and sensor coverage
    summary["constellation_coverage"] = dict(constellation_counts)
    summary["sensor_coverage"] = dict(sensor_counts)

    summary["average_cloud_cover"] = total_cloud_cover / summary["total_features"]
    summary["average_resolution"] = total_resolution / summary["total_features"]
    summary["constellations"] = list(summary["constellations"])
    summary["sensor_types"] = list(summary["sensor_types"])

    return summary

# Example usage
if __name__ == "__main__":
    # Example features data
    features = [
        {
            "properties": {
                "cloud_cover": 0.1,
                "constellation": "eros-b",
                "datetime": "2021-09-30T11:40:02Z",
                "resolution": 0.69,
                "sensor_type": "optical"
            }
        },
        {
            "properties": {
                "cloud_cover": 0,
                "constellation": "capella-sicd",
                "datetime": "2024-02-18T16:47:28Z",
                "resolution": 0.52,
                "sensor_type": "sar"
            }
        }
    ]

    summary = summarize_collection(features)
    logger.debug(f"Collection Summary: {summary}")
