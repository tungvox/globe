import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Box, Tabs, Tab } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import Slider from '@mui/material/Slider';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppContext } from '../contexts/AppContext';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CircularProgress from '@mui/material/CircularProgress';
import { buildApiUrl, SOCKET_URL } from '../config';

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    padding: theme.spacing(2)
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: '8px 8px 0 0',
  marginTop: -theme.spacing(2),
  marginLeft: -theme.spacing(2),
  marginRight: -theme.spacing(2),
  padding: theme.spacing(2)
}));

const ImageContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: theme.palette.grey[100],
  borderRadius: 8
}));

const MapComponent = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const [mapError, setMapError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { markers, addMarker, removeMarker, setMapInstance, selectedMarker, setSelectedMarker, setSelectedLocationPoint } = useAppContext();
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [isSearching, setIsSearching] = useState(false);
  const [socket, setSocket] = useState(null);
  const [cloudCover, setCloudCover] = useState(20); // Default to 20%
  const [statistics, setStatistics] = useState({
    averageCloudCover: 0,
    totalFeatures: 0,
    dateRange: '',
    totalImages: 0,
    goodImages: 0,
    badImages: 0,
    timeFrames: '',
  });
  const [analytics, setAnalytics] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const hasFetchedData = useRef(false);
  const [polygonLayer, setPolygonLayer] = useState(null);
  const [demoData, setDemoData] = useState({});
  const [locationPoints, setLocationPoints] = useState([]);
  const [locationLayerId, setLocationLayerId] = useState(null);
  const [currentPopup, setCurrentPopup] = useState(null);

  const handleMarkerClick = (marker) => {
    console.log('Marker clicked:', marker.name);
    setSelectedMarker(marker);
    // setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedMarker(null);
  };

  const handleDelete = () => {
    if (selectedMarker) {
      removeMarker(selectedMarker);
      handleClose();
    }
  };

  const handleSearchSatellite = async () => {
    if (!selectedMarker || !socket) return;
    
    setIsSearching(true);
    const coordinates = selectedMarker.getLngLat();
    
    socket.emit('search_satellite', {
        lat: coordinates.lat,
        lng: coordinates.lng,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        cloudCover: cloudCover
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Function to format cloud cover for display
  const formatCloudCover = (cloudCover) => {
    if (cloudCover === null || cloudCover === undefined || isNaN(cloudCover)) {
      return 'Not Available';
    }
    return `${(cloudCover * 100).toFixed(1)}%`;
  };

  // Function to create popup content for location details
  const createLocationPopupContent = (locationData, features) => {
    const images = features || [];
    
    return `
      <div id="location-popup-content" style="
        min-width: 280px; 
        max-width: 320px; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.4;
        background: #ffffff;
      ">
        <!-- Header -->
        <div style="
          background: #f8f9fa;
          color: #343a40;
          padding: 12px;
          margin-bottom: 0;
          border-bottom: 1px solid #e9ecef;
        ">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">📍 Location Data</div>
          <div style="font-size: 11px; color: #6c757d; font-family: monospace;">
            ${locationData.coordinates[0].toFixed(4)}°, ${locationData.coordinates[1].toFixed(4)}°
          </div>
        </div>
        
        <!-- Stats -->
        <div style="padding: 12px;">
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <div style="
              flex: 1;
              text-align: center;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #e9ecef;
            ">
              <div style="font-size: 16px; font-weight: 600; color: #495057;">${images.length}</div>
              <div style="font-size: 10px; color: #6c757d;">Images</div>
            </div>
            <div style="
              flex: 1;
              text-align: center;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #e9ecef;
            ">
              <div style="font-size: 16px; font-weight: 600; color: #495057;">${locationData.constellations?.length || 0}</div>
              <div style="font-size: 10px; color: #6c757d;">Satellites</div>
            </div>
            <div style="
              flex: 1;
              text-align: center;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #e9ecef;
            ">
              <div style="font-size: 16px; font-weight: 600; color: #495057;">${locationData.sensor_types?.length || 0}</div>
              <div style="font-size: 10px; color: #6c757d;">Sensors</div>
            </div>
          </div>
          
          ${locationData.date_range ? `
            <div style="
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 4px;
              padding: 8px;
              margin-bottom: 12px;
            ">
              <div style="font-size: 10px; color: #6c757d; font-weight: 500; margin-bottom: 2px;">OBSERVATION PERIOD</div>
              <div style="font-size: 11px; color: #495057; font-weight: 500;">
                ${new Date(locationData.date_range.earliest).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })} - 
                ${new Date(locationData.date_range.latest).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </div>
            </div>
          ` : ''}
        </div>
        
        ${images.length > 0 ? `
          <div style="
            border-top: 1px solid #e9ecef;
            background: #fafafa;
            margin-top: 0;
            padding: 12px;
          ">
            <div style="font-size: 12px; font-weight: 600; color: #495057; margin-bottom: 8px;">
              Images (${images.length})
            </div>
            
            <div style="max-height: 200px; overflow-y: auto;" id="images-container">
              ${images.slice(0, 5).map((feature, index) => `
                <div class="image-item" data-image-index="${index}" style="
                  margin-bottom: 6px; 
                  background: white;
                  border: 1px solid #e9ecef;
                  border-radius: 4px;
                  cursor: pointer;
                  transition: all 0.2s ease;
                " 
                onmouseover="this.style.backgroundColor='#f8f9fa'; this.style.borderColor='#ced4da'"
                onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#e9ecef'"
                onclick="toggleImageDetails(${index})">
                  
                  <div style="padding: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                          <span style="
                            background: #495057;
                            color: white;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-size: 9px;
                            font-weight: 500;
                          ">${feature.properties.constellation || 'Unknown'}</span>
                          <span style="font-size: 9px; color: #6c757d;">#${index + 1}</span>
                        </div>
                        
                        <div style="display: flex; gap: 12px; font-size: 10px;">
                          <div>
                            <span style="color: #6c757d;">Date:</span>
                            <span style="color: #495057; font-weight: 500;">
                              ${feature.properties.datetime ? new Date(feature.properties.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span style="color: #6c757d;">Res:</span>
                            <span style="color: #495057; font-weight: 500;">
                              ${feature.properties.resolution ? `${feature.properties.resolution}m` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span style="color: #6c757d;">Cloud:</span>
                            <span style="color: #495057; font-weight: 500;">
                              ${formatCloudCover(feature.properties.cloud_cover)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="expand-arrow" style="
                        color: #6c757d;
                        font-size: 12px;
                        transition: transform 0.2s ease;
                      ">▼</div>
                    </div>
                  </div>
                  
                  <div class="image-details" id="details-${index}" style="
                    display: none;
                    background: #f8f9fa;
                    border-top: 1px solid #e9ecef;
                    padding: 8px;
                  ">
                    <div style="font-size: 10px; font-weight: 600; color: #495057; margin-bottom: 6px;">
                      Details
                    </div>
                    
                    <div style="font-size: 9px; line-height: 1.3;">
                      <div style="margin-bottom: 3px;"><span style="color: #6c757d;">ID:</span> ${(feature.id || 'N/A').substring(0, 25)}${(feature.id || '').length > 25 ? '...' : ''}</div>
                      <div style="margin-bottom: 3px;"><span style="color: #6c757d;">Time:</span> ${feature.properties.datetime ? new Date(feature.properties.datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                      <div style="margin-bottom: 3px;"><span style="color: #6c757d;">Sensor:</span> ${feature.properties.sensor_type || 'N/A'}</div>
                      <div style="margin-bottom: 3px;"><span style="color: #6c757d;">Platform:</span> ${feature.properties.platform || 'N/A'}</div>
                      ${feature.properties.processing_level ? `<div style="margin-bottom: 3px;"><span style="color: #6c757d;">Processing:</span> ${feature.properties.processing_level}</div>` : ''}
                      ${feature.properties.solar_elevation ? `<div style="margin-bottom: 3px;"><span style="color: #6c757d;">Solar Elev:</span> ${feature.properties.solar_elevation}°</div>` : ''}
                      ${feature.properties.off_nadir ? `<div style="margin-bottom: 3px;"><span style="color: #6c757d;">Off Nadir:</span> ${feature.properties.off_nadir}°</div>` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
              ${images.length > 5 ? `
                <div style="
                  text-align: center;
                  color: #6c757d;
                  font-size: 10px;
                  margin-top: 8px;
                  padding: 6px;
                  background: white;
                  border-radius: 4px;
                  border: 1px solid #e9ecef;
                ">
                  +${images.length - 5} more images
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Function to show location popup
  const showLocationPopup = async (coordinates, locationData) => {
    if (!mapRef.current) return;

    try {
      // Close existing popup
      if (currentPopup) {
        currentPopup.remove();
      }

      // Fetch location-specific features
      console.log('Fetching features for popup...');
      const response = await fetch(buildApiUrl('/fetch_demo_data'));
      if (!response.ok) return;
      
      const demoData = await response.json();
      const features = demoData[selectedMarker.name] || [];
      
      // Filter features for this specific location
      const locationFeatures = features.filter(feature => {
        // Calculate centroid of the feature's polygon
        const coords = feature.geometry.coordinates[0];
        const centroid = coords.reduce((acc, coord) => {
          acc[0] += coord[0];
          acc[1] += coord[1];
          return acc;
        }, [0, 0]);
        centroid[0] /= coords.length;
        centroid[1] /= coords.length;
        
        // Use a more generous tolerance for coordinate matching
        const tolerance = 0.05;
        return Math.abs(centroid[0] - coordinates[0]) < tolerance && 
               Math.abs(centroid[1] - coordinates[1]) < tolerance;
      });

      // Add global function for toggling image details
      window.toggleImageDetails = (index) => {
        const detailsElement = document.getElementById(`details-${index}`);
        if (detailsElement) {
          const isVisible = detailsElement.style.display !== 'none';
          
          // Hide all other details first and reset all arrows
          document.querySelectorAll('.image-details').forEach((detail, i) => {
            detail.style.display = 'none';
            const arrow = detail.parentElement.querySelector('.expand-arrow');
            if (arrow) {
              arrow.innerHTML = '▼';
              arrow.style.transform = 'rotate(0deg)';
            }
          });
          
          // Toggle the clicked one
          if (!isVisible) {
            detailsElement.style.display = 'block';
            // Update arrow for the expanded item
            const arrow = detailsElement.parentElement.querySelector('.expand-arrow');
            if (arrow) {
              arrow.innerHTML = '▲';
              arrow.style.transform = 'rotate(0deg)';
            }
            
            // Scroll the details into view
            setTimeout(() => {
              detailsElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
              });
            }, 100);
          }
        }
      };

      // Create and show popup
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '450px',
        className: 'location-details-popup',
        anchor: 'bottom'
      })
        .setLngLat(coordinates)
        .setHTML(createLocationPopupContent(locationData, locationFeatures))
        .addTo(mapRef.current);

      setCurrentPopup(popup);

      // Handle popup close
      popup.on('close', () => {
        setCurrentPopup(null);
        // Clean up the global function
        if (window.toggleImageDetails) {
          delete window.toggleImageDetails;
        }
      });

    } catch (error) {
      console.error('Error showing location popup:', error);
    }
  };

  const handleAddMarker = (lng, lat, name = null) => {
    if (!name) {
        name = prompt("Enter a name for the marker:");
        if (!name) return;
    }

    const marker = new mapboxgl.Marker({
        color: "#FEDA6A",
        draggable: true
    })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

    marker.name = name;

    // Set the title attribute for the tooltip
    marker.getElement().title = `Name: ${name}\nLongitude: ${lng.toFixed(4)}\nLatitude: ${lat.toFixed(4)}`;

    let isDragging = false;

    marker.on('dragstart', () => {
        isDragging = true;
    });

    marker.on('dragend', () => {
        setTimeout(() => { isDragging = false; }, 100);
    });

    marker.getElement().addEventListener('click', (event) => {
        event.stopPropagation();
        if (!isDragging) {
            handleMarkerClick(marker);
        }
    });

    marker.getElement().addEventListener('contextmenu', (e) => {
        e.preventDefault();
        removeMarker(marker);
    });

    addMarker(marker);
  };

  // Helper function to calculate the centroid of a polygon
  const calculateCentroid = (coordinates) => {
    let x = 0, y = 0, n = coordinates.length;
    coordinates.forEach(coord => {
      x += coord[0];
      y += coord[1];
    });
    return [x / n, y / n];
  };

  const fetchDemoDataFromBackend = async () => {
    try {
      console.log('Fetching demo data from backend...');
      const response = await fetch(buildApiUrl('/fetch_demo_data'));
      if (!response.ok) {
        throw new Error(`Error fetching demo data: ${response.statusText}`);
      }
      const groupedData = await response.json();
      console.log('Demo data fetched successfully:', Object.keys(groupedData));
      setDemoData(groupedData);
      // Add markers for each collection
      Object.entries(groupedData).forEach(([collection, features]) => {
        const representativePoint = calculateCentroid(features[0].geometry.coordinates[0]);
        handleAddMarker(representativePoint[0], representativePoint[1], collection);
      });
      console.log('Demo markers added to map');
    } catch (error) {
      console.error('Error fetching demo data from backend:', error);
    }
  };

  useEffect(() => {
    if (!hasFetchedData.current) {
      fetchDemoDataFromBackend();
      hasFetchedData.current = true;
    }
  }, []);

  useEffect(() => {
    // Initialize socket connection
            const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    newSocket.on('search_results', (data) => {
      if (data.features && data.features.length > 0) {
        console.log(data);
        // Calculate statistics
        const totalFeatures = data.features.length;
        const totalCloudCover = data.features.reduce((sum, feature) => sum + feature.properties.cloudCover, 0);
        const averageCloudCover = totalCloudCover / totalFeatures;

        const dates = data.features.map(feature => new Date(feature.properties.datetime));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const dateRange = `${minDate.toDateString()} - ${maxDate.toDateString()}`;

        // Analyze satellite data for additional insights
        const analyzeSatelliteData = (features) => {
          let goodImages = 0;
          let badImages = 0;
          const cloudCoverThreshold = 20; // Example threshold
          const timeFrames = new Map();

          features.forEach(feature => {
            const datetime = new Date(feature.properties.datetime);
            const cloudCover = feature.properties.cloudCover;
            const monthYear = `${String(datetime.getMonth() + 1).padStart(2, '0')}-${datetime.getFullYear()}`; // Month before year

            if (!timeFrames.has(monthYear)) {
              timeFrames.set(monthYear, 0);
            }
            timeFrames.set(monthYear, timeFrames.get(monthYear) + 1);

            if (cloudCover <= cloudCoverThreshold) {
              goodImages++;
            } else {
              badImages++;
            }
          });

          // Sort timeFrames by date (oldest first)
          const sortedTimeFrames = Array.from(timeFrames.entries())
            .sort(([a], [b]) => new Date(`${a.split('-').reverse().join('-')}-01`) - new Date(`${b.split('-').reverse().join('-')}-01`))
            .map(([key, value]) => `${key} (${value} images)`)
            .join(', ');

          return {
            totalImages: features.length,
            goodImages,
            badImages,
            timeFrames: sortedTimeFrames,
          };
        };

        const analyticsData = analyzeSatelliteData(data.features);

        setStatistics({
          averageCloudCover,
          totalFeatures,
          dateRange,
          ...analyticsData,
        });

        setAnalytics(analyticsData);
      } else {
        console.log('No images found for the selected criteria');
        setStatistics({
          averageCloudCover: 0,
          totalFeatures: 0,
          dateRange: '',
          totalImages: 0,
          goodImages: 0,
          badImages: 0,
          timeFrames: '',
        });
        setAnalytics(null);
      }
      setIsSearching(false);
    });

    newSocket.on('search_error', (error) => {
      console.error('Search error:', error);
      setIsSearching(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!mapboxgl.supported()) {
      setMapError('Your browser does not support Mapbox GL');
      return;
    }

    const ACCESS_TOKEN = 'pk.eyJ1IjoidHVuZy10ZXJyYW1vbml0b3IiLCJhIjoiY202NTI2ZGVyMWsydzJrc29pMXN1c3N0cyJ9.fJQXXtm3s7hGuDxjdwcDBA';
    mapboxgl.accessToken = ACCESS_TOKEN;

    try {
      if (!mapContainerRef.current) {
        throw new Error("Map container is not available");
      }

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/tung-terramonitor/cm669q8j5005c01s25iijbyp9',
        center: [24.9338, 60.1992],
        zoom: 1.8,
        preserveDrawingBuffer: true,
        antialias: true
      });

      // Add the Geocoder control to the map
      const geocoder = new MapboxGeocoder({
        accessToken: ACCESS_TOKEN,
        mapboxgl: mapboxgl,
      });

      mapRef.current.addControl(geocoder, 'top-right');

      // Add the built-in zoom control
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      geocoder.on('result', (event) => {
        const { result } = event;
        if (result && result.center) {
          mapRef.current.flyTo({
            center: result.center,
            zoom: 14
          });

          // Add a yellow marker at the search result location
          new mapboxgl.Marker({
            color: "#FFFF00" // Set marker color to yellow
          })
            .setLngLat(result.center)
            .addTo(mapRef.current);
        }
      });

      // Set map instance in context
      setMapInstance(mapRef.current);

      // Handle WebGL context lost events
      mapRef.current.on('webglcontextlost', () => {
        console.log('WebGL context lost. Attempting to restore...');
        setTimeout(() => {
          try {
            mapRef.current.resize();
          } catch (e) {
            console.error('Failed to restore WebGL context:', e);
            setMapError('Map display error. Please refresh the page.');
          }
        }, 1000);
      });

      // Update marker creation to use optimized context
      mapRef.current.on('click', (e) => {
        // Check if the click occurred on a red dot (location point)
        const features = mapRef.current.queryRenderedFeatures(e.point);
        const hasLocationPoint = features.some(feature => 
          feature.layer.id && feature.layer.id.includes('location-points-')
        );
        
        // Only create marker if not clicking on a location point
        if (!hasLocationPoint) {
          const { lng, lat } = e.lngLat;
          handleAddMarker(lng, lat);
        }
      });
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      markers.forEach(marker => marker.remove());
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [addMarker, removeMarker, setMapInstance]);

  const drawPolygon = (coordinates) => {
    console.log('drawPolygon called with coordinates:', coordinates);
    if (!mapRef.current || !coordinates) {
      console.log('drawPolygon early return - mapRef:', !!mapRef.current, 'coordinates:', !!coordinates);
      return;
    }

    // Remove existing polygon layer if any
    if (polygonLayer) {
      console.log('Removing existing polygon layer');
      mapRef.current.removeLayer('polygon-layer');
      mapRef.current.removeSource('polygon-source');
    }

    console.log('Adding polygon source and layer');
    // Add a new source and layer for the polygon
    mapRef.current.addSource('polygon-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: coordinates
        }
      }
    });

    mapRef.current.addLayer({
      id: 'polygon-layer',
      type: 'fill',
      source: 'polygon-source',
      layout: {},
      paint: {
        'fill-color': '#8884d8',
        'fill-opacity': 0.5,
        'fill-outline-color': 'white'
      }
    });

    setPolygonLayer('polygon-layer');
    console.log('Polygon layer added successfully');
  };

  useEffect(() => {
    if (selectedMarker) {
      // Close any existing popup when marker changes
      if (currentPopup) {
        currentPopup.remove();
        setCurrentPopup(null);
      }

      mapRef.current.flyTo({
        center: selectedMarker.getLngLat(),
        zoom: 8
      });

      // Fetch collection metadata and draw collection polygon
      const fetchCollectionPolygon = async () => {
        try {
          console.log('Fetching collection metadata for:', selectedMarker.name);
          
          // First ensure demo data is cached
          const demoResponse = await fetch(buildApiUrl('/fetch_demo_data'));
          if (!demoResponse.ok) {
            console.error('Failed to fetch demo data for collection metadata');
            return;
          }
          
          const response = await fetch(buildApiUrl(`/collection/${selectedMarker.name}`));
          console.log('Collection metadata response status:', response.status);
          if (response.ok) {
            const collectionData = await response.json();
            console.log('Collection data:', collectionData);
            
            if (collectionData.polygon_coordinates) {
              console.log('Drawing collection polygon:', collectionData.collection_name);
              drawPolygon(collectionData.polygon_coordinates);
            } else {
              console.log('No polygon coordinates found for collection');
            }
          } else {
            console.error('Failed to fetch collection metadata:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching collection polygon:', error);
        }
      };

      fetchCollectionPolygon();
    }
  }, [selectedMarker]);

  useEffect(() => {
    if (selectedMarker) {
      // Fetch location points
      const fetchLocationPoints = async () => {
        try {
          console.log('Fetching location points for:', selectedMarker.name);
          
          // First ensure demo data is cached
          const demoResponse = await fetch(buildApiUrl('/fetch_demo_data'));
          if (!demoResponse.ok) {
            console.error('Failed to fetch demo data for location points');
            setLocationPoints([]);
            return;
          }
          
          const response = await fetch(buildApiUrl(`/locations/${selectedMarker.name}`));
          if (response.ok) {
            const data = await response.json();
            console.log('Location points fetched:', data.locations?.length || 0);
            setLocationPoints(data.locations || []);
          } else {
            console.error('Failed to fetch location points:', response.status, response.statusText);
            setLocationPoints([]);
          }
        } catch (e) {
          console.error('Error fetching location points:', e);
          setLocationPoints([]);
        }
      };
      fetchLocationPoints();
    } else {
      setLocationPoints([]);
    }
  }, [selectedMarker]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous location layer if exists
    if (locationLayerId && mapRef.current) {
      // Remove event listeners for the old layer
      try {
        mapRef.current.off('click', locationLayerId);
        mapRef.current.off('mouseenter', locationLayerId);
        mapRef.current.off('mouseleave', locationLayerId);
      } catch (e) {
        console.warn('Error removing old event listeners:', e);
      }
      
      // Remove layer and source
      if (mapRef.current.getLayer(locationLayerId)) {
        mapRef.current.removeLayer(locationLayerId);
        mapRef.current.removeSource(locationLayerId);
      }
    }

    if (locationPoints.length > 0 && selectedMarker) {
      const layerId = `location-points-${selectedMarker.name}`;
      const geojson = {
        type: 'FeatureCollection',
        features: locationPoints.map(loc => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: loc.coordinates },
          properties: {
            image_count: loc.image_count,
            id: loc.id
          }
        }))
      };
      mapRef.current.addSource(layerId, { type: 'geojson', data: geojson });
      mapRef.current.addLayer({
        id: layerId,
        type: 'circle',
        source: layerId,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'image_count'],
            1, 4,    // 1 image = 4px radius
            2, 8,    // 2 images = 8px radius
            3, 12,   // 3 images = 12px radius
            5, 16,   // 5 images = 16px radius
            10, 20,  // 10 images = 20px radius
            20, 24,  // 20 images = 24px radius
            50, 28   // 50 images = 28px radius
          ],
          'circle-color': '#e53935',
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Add click handler for location points
      mapRef.current.on('click', layerId, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const coordinates = feature.geometry.coordinates;
          const properties = feature.properties;
          
          // Find the full location data from locationPoints
          const locationData = locationPoints.find(loc => loc.id === properties.id);
          
          if (locationData) {
            // Show popup with location details
            showLocationPopup(coordinates, {
              ...locationData,
              coordinates: coordinates
            });
            
            // Optional: Fly to the location with lighter zoom
            mapRef.current.flyTo({
              center: coordinates,
              zoom: 10
            });
          }
        }
      });

      // Change the cursor to a pointer when hovering over location points
      mapRef.current.on('mouseenter', layerId, () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });

      mapRef.current.on('mouseleave', layerId, () => {
        mapRef.current.getCanvas().style.cursor = '';
      });

      setLocationLayerId(layerId);
    } else {
      setLocationLayerId(null);
    }
    // Remove on cleanup
    return () => {
      if (locationLayerId && mapRef.current) {
        // Remove event listeners
        try {
          mapRef.current.off('click', locationLayerId);
          mapRef.current.off('mouseenter', locationLayerId);
          mapRef.current.off('mouseleave', locationLayerId);
        } catch (e) {
          console.warn('Error removing event listeners:', e);
        }
        
        // Remove layer and source
        if (mapRef.current.getLayer(locationLayerId)) {
          mapRef.current.removeLayer(locationLayerId);
          mapRef.current.removeSource(locationLayerId);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationPoints, selectedMarker]);

  // Handle map resizing when selectedMarker changes
  useEffect(() => {
    if (mapRef.current) {
      // Trigger multiple resize events to ensure the map adjusts properly
      const resizeMap = () => {
        try {
          mapRef.current.resize();
        } catch (error) {
          console.error('Error resizing map:', error);
        }
      };
      
      // Immediate resize
      resizeMap();
      
      // Delayed resize to ensure DOM updates are complete
      setTimeout(resizeMap, 100);
      
      // Additional resize after transition completes
      setTimeout(resizeMap, 500);
    }
  }, [selectedMarker]);

  // Add window resize listener as fallback
  useEffect(() => {
    const handleWindowResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          try {
            mapRef.current.resize();
          } catch (error) {
            console.error('Error resizing map on window resize:', error);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const getChartData = () => {
    const chartData = [];

    if (analytics && analytics.timeFrames) {
      analytics.timeFrames.split(', ').forEach((timeFrame) => {
        const [label, count] = timeFrame.match(/(.+)\s\((\d+)\simages\)/).slice(1);
        chartData.push({ timeFrame: label, images: parseInt(count, 10) });
      });
    }

    // Sort chartData by timeFrame (oldest date first)
    chartData.sort((a, b) => new Date(`${a.timeFrame.split('-').reverse().join('-')}-01`) - new Date(`${b.timeFrame.split('-').reverse().join('-')}-01`));

    return chartData;
  };

  if (mapError) {
    return (
      <div className="map-error">
        <p>{mapError}</p>
        {mapError.includes('refresh') && (
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        style={{ 
          height: '100%', 
          position: 'relative',
          flex: selectedMarker ? '0 0 50%' : '1 1 100%',
          minWidth: selectedMarker ? '50%' : '100%',
          maxWidth: selectedMarker ? '50%' : '100%',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        ref={mapContainerRef}
        className="map-container"
      />
      
      <StyledDialog 
        open={dialogOpen} 
        onClose={handleClose} 
        maxWidth="lg"
        fullWidth
        sx={{ 
          '& .MuiDialog-paper': {
            width: '95%',
            height: '95vh',
          }
        }}
      >
        <StyledDialogTitle>Satellite Image Search</StyledDialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedMarker && (
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} wrap="nowrap">
              <Grid container item xs={12} sm={6} direction="column">
                <Grid item>
                  <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Location Details
                    </Typography>
                    <Typography variant="body1">
                      Longitude: {selectedMarker.getLngLat().lng.toFixed(4)}
                      <br />
                      Latitude: {selectedMarker.getLngLat().lat.toFixed(4)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      sx={{ width: '100%' }}
                      maxDate={endDate}
                      slotProps={{
                        textField: {
                          variant: 'outlined',
                          size: 'small'
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      sx={{ width: '100%' }}
                      minDate={startDate}
                      maxDate={dayjs()}
                      slotProps={{
                        textField: {
                          variant: 'outlined',
                          size: 'small'
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item>
                  <Typography variant="subtitle2" gutterBottom>
                    Max Cloud Cover: {cloudCover}%
                  </Typography>
                  <Slider
                    value={cloudCover}
                    onChange={(_, newValue) => setCloudCover(newValue)}
                    min={0}
                    max={100}
                    step={10}
                    marks
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                    sx={{ width: '100%' }}
                  />
                </Grid>

                <Grid item>
                  <Button 
                    onClick={handleSearchSatellite} 
                    color="primary" 
                    variant="contained"
                    sx={{ mt: 2, width: '100%' }}
                    disabled={isSearching}
                    startIcon={isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                  >
                    {isSearching ? 'Searching...' : 'Search Image'}
                  </Button>
                </Grid>
              </Grid>

              <Grid container item xs={12} sm={6} sx={{ width: '100%' }} direction="column">
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="Statistics and Graph Tabs">
                  <Tab label="Statistics" />
                  <Tab label="Graph" />
                </Tabs>

                {tabValue === 0 && (
                  <Grid item>
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        p: 3, 
                        backgroundColor: 'grey.100', 
                        borderRadius: 2, 
                        boxShadow: 3 
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Satellite Image Statistics
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Total Features:</strong> {statistics.totalFeatures}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Average Cloud Cover:</strong> {statistics.averageCloudCover.toFixed(2)}%
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Date Range:</strong> {statistics.dateRange}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Total Images:</strong> {statistics.totalImages}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Good Images:</strong> {statistics.goodImages}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Bad Images:</strong> {statistics.badImages}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Time Frames:</strong> {statistics.timeFrames}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {tabValue === 1 && (
                  <Grid item>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Graph
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timeFrame" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="images" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="outlined"
            startIcon={<DeleteIcon />}
          >
            Delete Marker
          </Button>
          <Button 
            onClick={handleClose}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </StyledDialog>
    </>
  );
};

export default MapComponent;