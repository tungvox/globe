import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useAppContext } from '../contexts/AppContext';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { theme } from '../theme';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { styled } from '@mui/material/styles';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { buildApiUrl } from '../config';

// Styled components for better visual appeal
const StyledPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1d1e22 0%, #2d2e32 100%)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  borderRadius: 0,
  overflow: 'hidden',
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  color: '#d4d4dc',
  fontWeight: 500,
  fontSize: '0.8rem',
  textTransform: 'none',
  minHeight: 32,
  padding: '4px 10px',
  '&.Mui-selected': {
    color: '#feda6a',
    fontWeight: 600,
  },
  '&:hover': {
    color: '#feda6a',
    opacity: 0.8,
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: '#feda6a',
    height: 2,
    borderRadius: 1,
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 8,
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
}));

const StatisticBar = ({theme}) => {
    // Add CSS animation for pulse effect
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);
    const { selectedMarker, setSelectedMarker, renameMarker } = useAppContext();
    const [summary, setSummary] = useState(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [originalFeatures, setOriginalFeatures] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    // News state
    const [newsLoading, setNewsLoading] = useState(false);
    const [newsArticles, setNewsArticles] = useState([]);
    const [newsError, setNewsError] = useState(null);
    const [usingCache, setUsingCache] = useState(false);
    // News cache
    const [newsCache, setNewsCache] = useState({});
    // News topics (static for now, can be replaced with API-driven list)
    const NEWS_TOPICS = [
        'All',
        'Conflict',
        'Disaster',
        'Economy',
        'Health',
        'Politics',
        'Environment',
        'Crime',
        'Technology',
        'Military',
        'Diplomacy',
        'Protest',
        'Energy',
        'Transport',
        'Education',
        'Sports',
        'Culture',
        'Weather',
        'Elections',
        'Terrorism',
        'Migration',
    ];
    const [selectedTopic, setSelectedTopic] = useState('Conflict');
    // Geocode cache to avoid hitting Nominatim rate limit
    const geocodeCache = {};
    const [geocoding, setGeocoding] = useState(false);

    useEffect(() => {
        if (selectedMarker) {
            console.log(selectedMarker);
            fetchSummaryData(selectedMarker.name);
        }
    }, [selectedMarker]);

    // Reset editing state when selectedMarker changes
    useEffect(() => {
        setIsEditingName(false);
        setEditName('');
    }, [selectedMarker]);

    // Debug useEffect for daily view
    useEffect(() => {
        if (selectedYear && selectedMonth) {
            console.log('Daily view debug:', {
                selectedYear,
                selectedMonth,
                originalFeaturesLength: originalFeatures.length,
                sampleFeature: originalFeatures[0]
            });
        }
    }, [selectedYear, selectedMonth, originalFeatures]);

    // Handle marker rename functionality
    const handleStartRename = () => {
        setIsEditingName(true);
        setEditName(selectedMarker.name);
    };

    const handleSaveRename = () => {
        if (editName.trim() && editName.trim() !== selectedMarker.name) {
            renameMarker(selectedMarker, editName.trim());
        }
        setIsEditingName(false);
        setEditName('');
    };

    const handleCancelRename = () => {
        setIsEditingName(false);
        setEditName('');
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSaveRename();
        } else if (event.key === 'Escape') {
            handleCancelRename();
        }
    };

    const fetchSummaryData = async (collectionName) => {
        try {
            console.log('Fetching summary for collection:', collectionName);
            
            // First ensure demo data is cached by calling fetch_demo_data
            const demoResponse = await fetch(buildApiUrl('/fetch_demo_data'));
            if (!demoResponse.ok) {
                throw new Error(`Error fetching demo data: ${demoResponse.statusText}`);
            }
            const demoData = await demoResponse.json();
            console.log('Demo data available, collections:', Object.keys(demoData));
            
            // Check if the collection exists in demo data
            if (!demoData[collectionName]) {
                throw new Error(`Collection ${collectionName} not found in demo data`);
            }
            
            // Now fetch the summary
            const response = await fetch(buildApiUrl(`/summary/${collectionName}`));
            if (!response.ok) {
                throw new Error(`Error fetching summary data: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Summary data fetched successfully for', collectionName);
            setSummary(data);

            // Set the original features for daily analysis
            const features = demoData[collectionName] || [];
            console.log('Original features loaded for', collectionName, ':', features.length);
            console.log('Sample feature:', features[0]);
            setOriginalFeatures(features);

            // Note: We no longer set polygon coordinates here since we use marker coordinates
            // The polygon is now drawn based on the marker's location

        } catch (error) {
            console.error('Error fetching summary data from backend:', error);
        }
    };

    const COLORS = ['#87BB62', '#4394E5', '#FEDA6A', '#FF6B6B'];

    const renderCustomBarLabel = ({ payload, x, y, width, height, value }) => {
        return (
            <text 
                x={x + width / 2} 
                y={y} 
                fill="#ffffff" 
                textAnchor="middle" 
                dy={-8} 
                fontSize="11" 
                fontWeight="600"
                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
            >
                {value}
            </text>
        );
    };

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    const transformFeaturesPerYearData = (featuresPerYear) => {
        const transformedData = [];
        for (const [year, months] of Object.entries(featuresPerYear)) {
            const yearTotal = Object.values(months).reduce((sum, count) => sum + count, 0);
            transformedData.push({ year, count: yearTotal });
        }
        return transformedData.sort((a, b) => a.year - b.year);
    };

    const transformFeaturesPerMonthData = (year, featuresPerYear) => {
        const monthsData = featuresPerYear[year] || {};
        return Object.entries(monthsData).map(([month, count]) => ({
            month: new Date(0, month - 1).toLocaleString('default', { month: 'short' }),
            monthNumber: parseInt(month),
            count
        }));
    };

    const transformFeaturesPerDayData = (year, month, features) => {
        console.log('transformFeaturesPerDayData called with:', { year, month, yearType: typeof year, monthType: typeof month, featuresCount: features.length });
        
        // Ensure year and month are numbers
        const targetYear = parseInt(year);
        const targetMonth = parseInt(month);
        
        console.log('Converted to numbers:', { targetYear, targetMonth });
        
        const dailyData = {};
        let processedCount = 0;
        let matchedCount = 0;
        
        features.forEach(feature => {
            const datetimeStr = feature.properties?.datetime;
            if (datetimeStr) {
                processedCount++;
                // Handle different datetime formats
                let datetime;
                try {
                    if (datetimeStr.includes('T')) {
                        // ISO format like "2025-06-09T00:00:00.000Z"
                        datetime = new Date(datetimeStr);
                    } else {
                        // Fallback for other formats
                        datetime = new Date(datetimeStr);
                    }
                    
                    const featureYear = datetime.getFullYear();
                    const featureMonth = datetime.getMonth() + 1; // getMonth() returns 0-11
                    
                    console.log(`Feature date: ${datetimeStr} -> Year: ${featureYear}, Month: ${featureMonth}, Target: ${year}, ${month}`);
                    
                    if (featureYear === targetYear && featureMonth === targetMonth) {
                        const day = datetime.getDate();
                        dailyData[day] = (dailyData[day] || 0) + 1;
                        matchedCount++;
                    }
                } catch (error) {
                    console.error('Error parsing date:', datetimeStr, error);
                }
            }
        });
        
        console.log(`Daily data processing: ${processedCount} features processed, ${matchedCount} matched for ${year}-${month}`);
        console.log('Daily data result:', dailyData);
        
        return Object.entries(dailyData).map(([day, count]) => ({
            day: parseInt(day),
            dayLabel: `${parseInt(day)}`,
            count
        })).sort((a, b) => a.day - b.day);
    };

    const getPath = (x, y, width, height) => (
        `M${x},${y + height}
         C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3} ${x + width / 2}, ${y}
         C${x + width / 2},${y + height / 3} ${x + 2 * width / 3},${y + height} ${x + width}, ${y + height}
         Z`
    );

    const TriangleBar = (props) => {
        const {
          fill, x, y, width, height,
        } = props;
      
        return (
            <path 
                d={getPath(x, y, width, height)} 
                stroke="none" 
                fill={fill}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
            />
        );
    };

    const getImagesForDay = (year, month, day, features) => {
        const dayImages = [];
        
        // Ensure all parameters are numbers for consistent comparison
        const targetYear = parseInt(year);
        const targetMonth = parseInt(month);
        const targetDay = parseInt(day);
        
        console.log('getImagesForDay called with:', { targetYear, targetMonth, targetDay, featuresCount: features.length });
        
        features.forEach(feature => {
            const datetimeStr = feature.properties?.datetime;
            if (datetimeStr) {
                try {
                    const datetime = new Date(datetimeStr);
                    const featureYear = datetime.getFullYear();
                    const featureMonth = datetime.getMonth() + 1;
                    const featureDay = datetime.getDate();
                    
                    console.log(`Checking feature: ${datetimeStr} -> Year: ${featureYear}, Month: ${featureMonth}, Day: ${featureDay}, Target: ${targetYear}, ${targetMonth}, ${targetDay}`);
                    
                    if (featureYear === targetYear && featureMonth === targetMonth && featureDay === targetDay) {
                        // Validate and provide defaults for missing or invalid data
                        const cloudCover = feature.properties.cloud_cover;
                        // Keep original value (including null/undefined) for proper "Not Available" display
                        
                        const resolution = feature.properties.resolution;
                        const validResolution = (resolution !== null && resolution !== undefined && !isNaN(resolution)) ? resolution : 0;
                        
                        dayImages.push({
                            id: feature.id || 'Unknown',
                            datetime: datetimeStr,
                            cloud_cover: cloudCover, // Keep original value
                            resolution: validResolution,
                            constellation: feature.properties.constellation || 'Unknown',
                            sensor_type: feature.properties.sensor_type || 'Unknown',
                            geometry: feature.geometry,
                            properties: feature.properties
                        });
                    }
                } catch (error) {
                    console.error('Error parsing date for image:', datetimeStr, error);
                }
            }
        });
        
        console.log(`Found ${dayImages.length} images for ${targetYear}-${targetMonth}-${targetDay}`);
        
        return dayImages.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    };

    const handleBarClick = (data) => {
        if (selectedYear && selectedMonth && selectedDay) {
            // If we're at image level, go back to day level
            setSelectedDay(null);
            setSelectedImage(null);
        } else if (selectedYear && selectedMonth) {
            // If we're at day level, go to image level
            setSelectedDay(data.day);
        } else if (selectedYear) {
            // If we're at month level, go to day level
            setSelectedMonth(data.monthNumber);
        } else {
            // If we're at year level, go to month level
            setSelectedYear(data.year);
        }
    };

    const handleMonthClick = (data) => {
        setSelectedMonth(data.monthNumber);
    };

    const StatisticItem = ({ label, value, color = '#feda6a' }) => (
        <Box sx={{ textAlign: 'center', p: 0.5 }}>
            <Typography variant="h5" sx={{ color, fontWeight: 'bold', mb: 0.25 }}>
                {value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                {label}
            </Typography>
        </Box>
    );

    const formatCloudCover = (cloudCover) => {
        if (cloudCover === null || cloudCover === undefined || isNaN(cloudCover)) {
            return 'Not Available';
        }
        return `${(cloudCover * 100).toFixed(1)}%`;
    };

    // Fetch news when News tab, marker, or topic changes
    useEffect(() => {
        if (tabIndex === 3 && selectedMarker) {
            const fetchNews = async () => {
                try {
                    let query = '';
                    if (selectedTopic && selectedTopic !== 'All') {
                        query = selectedTopic;
                    }
                    // Use geocoded place name if available
                    let geocodedName = '';
                    if (selectedMarker && selectedMarker.getLngLat) {
                        const { lat, lng } = selectedMarker.getLngLat();
                        try {
                            geocodedName = await getPlaceNameFromCoords(lat, lng);
                        } catch (e) {
                            geocodedName = '';
                        }
                    }
                    if (geocodedName) {
                        query = query ? `${query} ${geocodedName}` : geocodedName;
                    }
                    if (!query) {
                        query = 'news';
                    }

                    // Create cache key
                    const cacheKey = `${selectedMarker.name}_${selectedTopic}_${query}`;
                    
                    // Check if we have cached data
                    if (newsCache[cacheKey]) {
                        const cachedData = newsCache[cacheKey];
                        const now = Date.now();
                        const cacheAge = now - cachedData.timestamp;
                        const cacheExpiry = 5 * 60 * 1000; // 5 minutes
                        
                        if (cacheAge < cacheExpiry) {
                            console.log('Using cached news data for:', cacheKey);
                            setNewsArticles(cachedData.articles);
                            setNewsError(null);
                            setNewsLoading(false);
                            setUsingCache(true);
                            return;
                        } else {
                            console.log('Cache expired for:', cacheKey);
                            // Remove expired cache entry
                            setNewsCache(prev => {
                                const newCache = { ...prev };
                                delete newCache[cacheKey];
                                return newCache;
                            });
                        }
                    }

                    setNewsLoading(true);
                    setNewsError(null);
                    setNewsArticles([]);
                    setUsingCache(false);

                    const url = `/google_news?q=${encodeURIComponent(query)}`;
                    const response = await fetch(url);
                    const contentType = response.headers.get('content-type');
                    const text = await response.text();
                    console.log('Google News API response:', text); // Log the raw response
                    
                    if (contentType && contentType.includes('application/json')) {
                        try {
                            const data = JSON.parse(text);
                            if (data && data.articles && Array.isArray(data.articles)) {
                                // Cache the successful response
                                setNewsCache(prev => ({
                                    ...prev,
                                    [cacheKey]: {
                                        articles: data.articles,
                                        timestamp: Date.now()
                                    }
                                }));
                                setNewsArticles(data.articles);
                                setNewsError(null);
                            } else {
                                setNewsArticles([]);
                                setNewsError('No news articles found for this location.');
                            }
                        } catch (jsonErr) {
                            setNewsError('Could not parse news response.');
                            setNewsArticles([]);
                        }
                    } else {
                        setNewsError('News service returned an error. Please try again later.');
                        setNewsArticles([]);
                    }
                } catch (err) {
                    setNewsError('Could not fetch news articles.');
                    setNewsArticles([]);
                } finally {
                    setNewsLoading(false);
                }
            };
            fetchNews();
        }
    }, [tabIndex, selectedMarker, selectedTopic, newsCache]);

    async function getPlaceNameFromCoords(lat, lon) {
        // Respect Nominatim's rate limit: 1 request/sec
        await new Promise(res => setTimeout(res, 1100));
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'GlobeApp/1.0 (contact@example.com)' }
        });
        const data = await response.json();
        const placeName = data.address.city || data.address.town || data.address.village || data.address.state || data.address.country || '';
        return placeName;
    }

    return (
        <StyledPaper
            sx={{
                flex: selectedMarker ? '0 0 50%' : '0 0 0%',
                height: '100%',
                padding: selectedMarker ? 3 : 0,
                zIndex: 1000,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                borderLeft: selectedMarker ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                boxShadow: selectedMarker ? '-4px 0 20px rgba(0, 0, 0, 0.3)' : 'none',
                minWidth: selectedMarker ? '50%' : '0px',
                maxWidth: selectedMarker ? '50%' : '0px',
                width: selectedMarker ? '50%' : '0px',
                opacity: selectedMarker ? 1 : 0,
                visibility: selectedMarker ? 'visible' : 'hidden',
            }}
        >
            <Button
                sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    minWidth: 'auto',
                    width: 32,
                    height: 32,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#d4d4dc',
                    borderRadius: '50%',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                    zIndex: 1001,
                }}
                onClick={() => {
                    setSelectedMarker(null);
                }}>
                <CloseIcon sx={{ fontSize: 18 }} />
            </Button>
            
            {selectedMarker ? (
                <>
                    <Box sx={{ mb: 1.5, pr: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                            {isEditingName ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <TextField
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        autoFocus
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            flex: 1,
                                            mr: 1,
                                            '& .MuiOutlinedInput-root': {
                                                color: '#feda6a',
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                '& fieldset': {
                                                    borderColor: 'rgba(254, 218, 106, 0.5)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: '#feda6a',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#feda6a',
                                                },
                                            },
                                            '& .MuiInputBase-input': {
                                                padding: '6px 10px',
                                            }
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={handleSaveRename}
                                        sx={{
                                            color: '#2ecc71',
                                            mr: 0.5,
                                            '&:hover': {
                                                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                                            }
                                        }}
                                    >
                                        <CheckIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={handleCancelRename}
                                        sx={{
                                            color: '#e74c3c',
                                            '&:hover': {
                                                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                                            }
                                        }}
                                    >
                                        <CancelIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            fontWeight: 600, 
                                            color: '#feda6a', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                            flex: 1,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {selectedMarker.name}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={handleStartRename}
                                        sx={{
                                            color: '#d4d4dc',
                                            opacity: 0.7,
                                            '&:hover': {
                                                opacity: 1,
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            }
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#d4d4dc', 
                                opacity: 0.8,
                                fontFamily: 'monospace',
                                fontSize: '0.75rem'
                            }}
                        >
                            {`${selectedMarker.getLngLat().lng.toFixed(4)}, ${selectedMarker.getLngLat().lat.toFixed(4)}`}
                        </Typography>
                    </Box>

                    <StyledTabs 
                        value={tabIndex} 
                        onChange={handleTabChange} 
                        aria-label="statistic tabs"
                        sx={{ mb: 1.5 }}
                    >
                        <StyledTab label="Overview" />
                        <StyledTab label="Analytics" />
                        <StyledTab label="Details" />
                        <StyledTab label="News" />
                    </StyledTabs>

                    <Divider sx={{ mb: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                    <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100% - 200px)', pr: 1 }}>
                        {tabIndex === 0 && summary && (
                            <>
                                {/* Key Statistics Cards */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={6}>
                                        <StatCard>
                                            <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                                <StatisticItem 
                                                    label="Total Satellite Images" 
                                                    value={summary.total_features} 
                                                    color="#87BB62"
                                                />
                                            </CardContent>
                                        </StatCard>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <StatCard>
                                            <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                                <StatisticItem 
                                                    label="Locations with >1 Image" 
                                                    value={summary.locations_with_multiple_images} 
                                                    color="#FEDA6A"
                                                />
                                            </CardContent>
                                        </StatCard>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <StatCard>
                                            <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                                <StatisticItem 
                                                    label="Cloud Cover %" 
                                                    value={formatCloudCover(summary.average_cloud_cover)} 
                                                    color="#FF6B6B"
                                                />
                                            </CardContent>
                                        </StatCard>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <StatCard>
                                            <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                                <StatisticItem 
                                                    label="Resolution" 
                                                    value={`${summary.average_resolution.toFixed(2)}m`} 
                                                    color="#4394E5"
                                                />
                                            </CardContent>
                                        </StatCard>
                                    </Grid>
                                </Grid>

                                {/* Features Chart */}
                                <StatCard>
                                    <CardContent sx={{ p: 1 }}>
                                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                            {selectedYear && selectedMonth && selectedDay ? 
                                                `Images on ${new Date(selectedYear, selectedMonth - 1, selectedDay).toLocaleDateString()}` :
                                                selectedYear && selectedMonth ? 
                                                `Features on ${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}` :
                                                selectedYear ? 
                                                `Features in ${selectedYear}` : 
                                                'Features Per Year'}
                                        </Typography>

                                        {/* Breadcrumb Navigation for Drilldown (moved here) */}
                                        {(selectedYear || selectedMonth || selectedDay) && (
                                            <Box sx={{ mb: 1, ml: 0.5 }}>
                                                <Breadcrumbs aria-label="drilldown breadcrumbs" separator="›" sx={{ color: '#feda6a' }}>
                                                    <Link
                                                        underline="hover"
                                                        color="inherit"
                                                        sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                                                        onClick={() => {
                                                            setSelectedYear(null);
                                                            setSelectedMonth(null);
                                                            setSelectedDay(null);
                                                            setSelectedImage(null);
                                                        }}
                                                    >
                                                        All Years
                                                    </Link>
                                                    {selectedYear && (
                                                        <Link
                                                            underline={selectedMonth || selectedDay ? 'hover' : 'none'}
                                                            color={selectedMonth || selectedDay ? 'inherit' : '#feda6a'}
                                                            sx={{ cursor: selectedMonth || selectedDay ? 'pointer' : 'default', fontWeight: 600, fontSize: '0.9rem' }}
                                                            onClick={() => {
                                                                setSelectedYear(selectedYear);
                                                                setSelectedMonth(null);
                                                                setSelectedDay(null);
                                                                setSelectedImage(null);
                                                            }}
                                                        >
                                                            {selectedYear}
                                                        </Link>
                                                    )}
                                                    {selectedYear && selectedMonth && (
                                                        <Link
                                                            underline={selectedDay ? 'hover' : 'none'}
                                                            color={selectedDay ? 'inherit' : '#feda6a'}
                                                            sx={{ cursor: selectedDay ? 'pointer' : 'default', fontWeight: 600, fontSize: '0.9rem' }}
                                                            onClick={() => {
                                                                setSelectedMonth(selectedMonth);
                                                                setSelectedDay(null);
                                                                setSelectedImage(null);
                                                            }}
                                                        >
                                                            {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}
                                                        </Link>
                                                    )}
                                                    {selectedYear && selectedMonth && selectedDay && (
                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#feda6a' }}>
                                                            {selectedDay}
                                                        </Typography>
                                                    )}
                                                </Breadcrumbs>
                                            </Box>
                                        )}

                                        {/* Debug info */}
                                        {selectedYear && selectedMonth && (
                                            <Box sx={{ mb: 1, p: 0.5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 0.5 }}>
                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.6rem' }}>
                                                    Debug: Year={selectedYear}, Month={selectedMonth}, Day={selectedDay}, Features={originalFeatures.length}
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        <ResponsiveContainer width="100%" height={180}>
                                            {(() => {
                                                let chartData;
                                                if (selectedYear && selectedMonth && selectedDay) {
                                                    // Show individual images for the selected day
                                                    const dayImages = getImagesForDay(selectedYear, selectedMonth, selectedDay, originalFeatures);
                                                    console.log('Chart data for day view:', { selectedYear, selectedMonth, selectedDay, dayImagesCount: dayImages.length });
                                                    chartData = dayImages.map((image, index) => ({
                                                        id: image.id,
                                                        time: new Date(image.datetime).toLocaleTimeString(),
                                                        count: 1,
                                                        image: image
                                                    }));
                                                } else if (selectedYear && selectedMonth) {
                                                    chartData = transformFeaturesPerDayData(selectedYear, selectedMonth, originalFeatures);
                                                    console.log('Daily chart data result:', chartData);
                                                    if (chartData.length === 0) {
                                                        console.log('No daily data found for', selectedYear, selectedMonth);
                                                    }
                                                } else if (selectedYear) {
                                                    chartData = transformFeaturesPerMonthData(selectedYear, summary.features_per_year);
                                                } else {
                                                    chartData = transformFeaturesPerYearData(summary.features_per_year);
                                                }
                                                return (
                                                    <BarChart
                                                        data={chartData}
                                                        margin={{ top: 15, right: 8, left: 8, bottom: 8 }}
                                                    >
                                                        <defs>
                                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#feda6a" stopOpacity={0.9} />
                                                                <stop offset="100%" stopColor="#f39c12" stopOpacity={0.7} />
                                                            </linearGradient>
                                                            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#f1c40f" stopOpacity={1} />
                                                                <stop offset="100%" stopColor="#e67e22" stopOpacity={0.8} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid 
                                                            strokeDasharray="3 3" 
                                                            stroke="rgba(255, 255, 255, 0.1)" 
                                                            vertical={false}
                                                        />
                                                        <XAxis 
                                                            dataKey={selectedYear && selectedMonth && selectedDay ? "time" : selectedYear && selectedMonth ? "dayLabel" : selectedYear ? "month" : "year"} 
                                                            tick={{ fill: '#d4d4dc', fontSize: 10, fontWeight: 500 }}
                                                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                                                            tickLine={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                                                        />
                                                        <YAxis 
                                                            domain={selectedYear && selectedMonth && selectedDay ? [0, 'dataMax + 1'] : selectedYear && selectedMonth ? [0, 'dataMax + 1'] : selectedYear ? [0, 'dataMax + 10'] : [0, 'dataMax + 50']} 
                                                            tick={{ fill: '#d4d4dc', fontSize: 10, fontWeight: 500 }}
                                                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                                                            tickLine={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                backgroundColor: '#1d1e22', 
                                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                                borderRadius: 8,
                                                                color: '#d4d4dc',
                                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                                                fontSize: '12px'
                                                            }}
                                                            labelStyle={{ color: '#feda6a', fontWeight: 600 }}
                                                        />
                                                        <Bar 
                                                            dataKey="count" 
                                                            fill="url(#barGradient)"
                                                            shape={<TriangleBar />} 
                                                            label={renderCustomBarLabel} 
                                                            onClick={handleBarClick}
                                                            radius={[4, 4, 0, 0]}
                                                            stroke="#f39c12"
                                                            strokeWidth={1}
                                                        />
                                                    </BarChart>
                                                );
                                            })()}
                                        </ResponsiveContainer>
                                        
                                        {/* Image List for Selected Day */}
                                        {selectedYear && selectedMonth && selectedDay && (
                                            <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a', fontSize: '0.9rem' }}>
                                                    📸 Images for {new Date(selectedYear, selectedMonth - 1, selectedDay).toLocaleDateString()}
                                                </Typography>
                                                {(() => {
                                                    const dayImages = getImagesForDay(selectedYear, selectedMonth, selectedDay, originalFeatures);
                                                    return (
                                                        <Box>
                                                            {dayImages.map((image, index) => {
                                                                const expanded = selectedImage && selectedImage.id === image.id;
                                                                return (
                                                                    <Box 
                                                                        key={image.id}
                                                                        sx={{ 
                                                                            mb: 1, 
                                                                            p: 1, 
                                                                            backgroundColor: expanded ? 'rgba(254,218,106,0.08)' : 'rgba(255,255,255,0.05)', 
                                                                            borderRadius: 0.5,
                                                                            border: expanded ? '2px solid #feda6a' : '1px solid rgba(255,255,255,0.1)',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s ease',
                                                                        }}
                                                                        onClick={() => setSelectedImage(expanded ? null : image)}
                                                                    >
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <Box>
                                                                                <Typography variant="body2" sx={{ color: '#feda6a', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                                                    Image {index + 1}
                                                                                </Typography>
                                                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                                    {new Date(image.datetime).toLocaleTimeString()}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Box sx={{ textAlign: 'right' }}>
                                                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                                    {image.constellation}
                                                                                </Typography>
                                                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                                    {image.resolution}m
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.6rem' }}>
                                                                                Cloud: {formatCloudCover(image.cloud_cover)}
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.6rem' }}>
                                                                                {image.sensor_type}
                                                                            </Typography>
                                                                        </Box>
                                                                        {expanded && (
                                                                            <Box sx={{ mt: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 1, p: 1 }}>
                                                                                <Typography variant="body2" sx={{ color: '#feda6a', fontWeight: 'bold', fontSize: '0.8rem', mb: 1 }}>
                                                                                    Image Details
                                                                                </Typography>
                                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                                    <Box sx={{ minWidth: 120 }}>
                                                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}><strong>ID:</strong> {image.id}</Typography>
                                                                                    </Box>
                                                                                    <Box sx={{ minWidth: 120 }}>
                                                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}><strong>Date & Time:</strong> {new Date(image.datetime).toLocaleString()}</Typography>
                                                                                    </Box>
                                                                                    <Box sx={{ minWidth: 120 }}>
                                                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}><strong>Constellation:</strong> {image.constellation}</Typography>
                                                                                    </Box>
                                                                                    <Box sx={{ minWidth: 120 }}>
                                                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}><strong>Sensor Type:</strong> {image.sensor_type}</Typography>
                                                                                    </Box>
                                                                                    <Box sx={{ minWidth: 120 }}>
                                                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}><strong>Resolution:</strong> {image.resolution}m</Typography>
                                                                                    </Box>
                                                                                    <Box sx={{ minWidth: 120 }}>
                                                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}><strong>Cloud Cover:</strong> {formatCloudCover(image.cloud_cover)}</Typography>
                                                                                    </Box>
                                                                                </Box>
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                );
                                                            })}
                                                            {dayImages.length === 0 && (
                                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.8rem', textAlign: 'center', py: 2 }}>
                                                                    No images found for this day
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    );
                                                })()}
                                            </Box>
                                        )}
                                    </CardContent>
                                </StatCard>

                                {/* Temporal Coverage */}
                                {summary.date_range && (
                                    <StatCard>
                                        <CardContent sx={{ p: 1 }}>
                                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                📅 Temporal Coverage
                                            </Typography>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', mb: 0.5 }}>
                                                        <strong>Date Range:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.8rem' }}>
                                                        {new Date(summary.date_range.earliest).toLocaleDateString()} - {new Date(summary.date_range.latest).toLocaleDateString()}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', mb: 0.5 }}>
                                                        <strong>Coverage Span:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.8rem' }}>
                                                        {summary.date_range.date_span_days} days
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', mb: 0.5 }}>
                                                        <strong>Unique Dates:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.8rem' }}>
                                                        {summary.date_range.total_days} days
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', mb: 0.5 }}>
                                                        <strong>Avg Images/Day:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.8rem' }}>
                                                        {(summary.total_features / summary.date_range.total_days).toFixed(1)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </StatCard>
                                )}

                                {/* Satellite Coverage */}
                                {summary.constellation_coverage && Object.keys(summary.constellation_coverage).length > 0 && (
                                    <StatCard>
                                        <CardContent sx={{ p: 1 }}>
                                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                🛰️ Satellite Coverage
                                            </Typography>
                                            <Grid container spacing={0.5}>
                                                {Object.entries(summary.constellation_coverage)
                                                    .sort(([,a], [,b]) => b - a)
                                                    .slice(0, 6)
                                                    .map(([constellation, count]) => (
                                                        <Grid item xs={6} key={constellation}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 0.5 }}>
                                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                    {constellation}
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: '#feda6a', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                                                    {count}
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                            </Grid>
                                            {Object.keys(summary.constellation_coverage).length > 6 && (
                                                <Typography variant="body2" sx={{ color: '#d4d4dc', mt: 0.5, fontSize: '0.7rem', textAlign: 'center' }}>
                                                    +{Object.keys(summary.constellation_coverage).length - 6} more constellations
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </StatCard>
                                )}

                                {/* Multi-Image Locations */}
                                {summary.multi_image_locations && summary.multi_image_locations.length > 0 && (
                                    <StatCard>
                                        <CardContent sx={{ p: 1 }}>
                                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                📸 Locations with Multiple Images ({summary.locations_with_multiple_images})
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#d4d4dc', mb: 1, fontSize: '0.8rem' }}>
                                                Geographic locations with multiple satellite images for temporal analysis
                                            </Typography>
                                            
                                            {/* Summary breakdown */}
                                            <Box sx={{ mb: 1, p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 0.5 }}>
                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                    <strong>Image Distribution:</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                    • {summary.total_features - summary.unique_locations} images in multi-image locations
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                    • {summary.unique_locations - summary.locations_with_multiple_images} locations with single images
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                    • {summary.unique_locations} total unique geographic locations
                                                </Typography>
                                            </Box>
                                            
                                            {summary.multi_image_locations.slice(0, 3).map((location, index) => (
                                                <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 0.5 }}>
                                                    <Typography variant="body2" sx={{ color: '#feda6a', fontWeight: 'bold', mb: 0.5, fontSize: '0.8rem' }}>
                                                        Location {index + 1} ({location.image_count} images)
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.25 }}>
                                                        <strong>Date Range:</strong> {new Date(location.date_range.earliest).toLocaleDateString()} - {new Date(location.date_range.latest).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.25 }}>
                                                        <strong>Satellites:</strong> {location.constellations.join(', ')}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                        <strong>Sensors:</strong> {location.sensor_types.join(', ')}
                                                    </Typography>
                                                </Box>
                                            ))}
                                            
                                            {summary.multi_image_locations.length > 3 && (
                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', textAlign: 'center' }}>
                                                    +{summary.multi_image_locations.length - 3} more locations
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </StatCard>
                                )}

                                {/* Resolution Distribution */}
                                <StatCard>
                                    <CardContent sx={{ p: 1 }}>
                                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                            Resolution Distribution
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'High Resolution', value: summary.high_resolution },
                                                        { name: 'Very High Resolution', value: summary.very_high_resolution }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={60}
                                                    innerRadius={30}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    stroke="#1d1e22"
                                                    strokeWidth={2}
                                                >
                                                    {COLORS.map((color, index) => (
                                                        <Cell key={`cell-${index}`} fill={color} />
                                                    ))}
                                                </Pie>
                                                <Legend 
                                                    verticalAlign="bottom" 
                                                    align="center" 
                                                    height={36}
                                                    wrapperStyle={{ color: '#d4d4dc' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </StatCard>
                            </>
                        )}
                        
                        {tabIndex === 1 && (
                            <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100% - 200px)', pr: 1 }}>
                                {summary && (
                                    <>
                                        {/* Satellite Monitoring Overview */}
                                        <StatCard>
                                            <CardContent sx={{ p: 1 }}>
                                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                    🎯 Satellite Monitoring Overview
                                                </Typography>
                                                <Grid container spacing={1} sx={{ mb: 2 }}>
                                                    <Grid item xs={6}>
                                                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                                                            <Typography variant="h6" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                                                {summary.total_features}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                Total Satellite Images
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                                                            <Typography variant="h6" sx={{ color: '#3498db', fontWeight: 'bold' }}>
                                                                {summary.locations_with_multiple_images}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                Multi-Image Locations
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                                                            <Typography variant="h6" sx={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                                                {summary.date_range ? summary.date_range.date_span_days : 0}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                Days of Coverage
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box sx={{ textAlign: 'center', p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                                                            <Typography variant="h6" sx={{ color: '#f39c12', fontWeight: 'bold' }}>
                                                                {summary.average_cloud_cover ? summary.average_cloud_cover.toFixed(1) : 0}%
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                Avg Cloud Cover
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </StatCard>

                                        {/* Temporal Analysis for Satellite Monitoring */}
                                        <StatCard>
                                            <CardContent sx={{ p: 1 }}>
                                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                    ⏰ Temporal Analysis
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#d4d4dc', mb: 1, fontSize: '0.8rem' }}>
                                                    Monitoring frequency and pattern analysis
                                                </Typography>
                                                
                                                {summary.features_per_year && (
                                                    <Box sx={{ mb: 1 }}>
                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                            <strong>Monitoring Intensity:</strong>
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{ 
                                                                flex: 1, 
                                                                height: 8, 
                                                                backgroundColor: 'rgba(255,255,255,0.1)', 
                                                                borderRadius: 4,
                                                                overflow: 'hidden'
                                                            }}>
                                                                <Box sx={{ 
                                                                    width: `${Math.min(100, (summary.total_features / 50) * 100)}%`,
                                                                    height: '100%',
                                                                    background: 'linear-gradient(90deg, #e74c3c, #f39c12)',
                                                                    borderRadius: 4
                                                                }} />
                                                            </Box>
                                                            <Typography variant="body2" sx={{ color: '#feda6a', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                                {summary.total_features > 20 ? 'High' : summary.total_features > 10 ? 'Medium' : 'Low'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}

                                                {summary.date_range && (
                                                    <Box sx={{ mb: 1 }}>
                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                            <strong>Coverage Continuity:</strong>
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                            {summary.date_range.date_span_days > 365 ? 'Long-term monitoring' : 
                                                             summary.date_range.date_span_days > 90 ? 'Medium-term monitoring' : 'Short-term monitoring'}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Box sx={{ mb: 1 }}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                        <strong>Average Frequency:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                        {summary.date_range ? 
                                                            `${(summary.total_features / summary.date_range.date_span_days).toFixed(1)} observations per day` : 
                                                            'N/A'}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </StatCard>

                                        {/* Coverage Quality Assessment */}
                                        <StatCard>
                                            <CardContent sx={{ p: 1 }}>
                                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                    📊 Coverage Quality Assessment
                                                </Typography>
                                                
                                                <Box sx={{ mb: 1 }}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                        <strong>Image Quality Score:</strong>
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ 
                                                            flex: 1, 
                                                            height: 6, 
                                                            backgroundColor: 'rgba(255,255,255,0.1)', 
                                                            borderRadius: 3,
                                                            overflow: 'hidden'
                                                        }}>
                                                            <Box sx={{ 
                                                                width: `${Math.max(0, 100 - summary.average_cloud_cover)}%`,
                                                                height: '100%',
                                                                background: summary.average_cloud_cover < 20 ? 'linear-gradient(90deg, #2ecc71, #27ae60)' :
                                                                           summary.average_cloud_cover < 40 ? 'linear-gradient(90deg, #f39c12, #e67e22)' :
                                                                           'linear-gradient(90deg, #e74c3c, #c0392b)',
                                                                borderRadius: 3
                                                            }} />
                                                        </Box>
                                                        <Typography variant="body2" sx={{ 
                                                            color: summary.average_cloud_cover < 20 ? '#2ecc71' : 
                                                                   summary.average_cloud_cover < 40 ? '#f39c12' : '#e74c3c', 
                                                            fontSize: '0.7rem', 
                                                            fontWeight: 'bold' 
                                                        }}>
                                                            {summary.average_cloud_cover < 20 ? 'Excellent' : 
                                                             summary.average_cloud_cover < 40 ? 'Good' : 'Poor'}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ mb: 1 }}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                        <strong>Resolution Quality:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                        {summary.average_resolution < 1 ? 'Very High Resolution (Sub-meter)' :
                                                         summary.average_resolution < 3 ? 'High Resolution (Multi-meter)' :
                                                         summary.average_resolution < 10 ? 'Medium Resolution (Decameter)' : 'Low Resolution (Overview)'}
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                        <strong>Monitoring Reliability:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                        {summary.locations_with_multiple_images > 5 ? 'High reliability with multiple observations' :
                                                         summary.locations_with_multiple_images > 2 ? 'Moderate reliability with some redundancy' :
                                                         'Limited reliability - single observations'}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </StatCard>

                                        {/* Satellite Fleet Analysis */}
                                        <StatCard>
                                            <CardContent sx={{ p: 1 }}>
                                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                    🛰️ Satellite Fleet Analysis
                                                </Typography>
                                                
                                                {summary.constellation_coverage && Object.keys(summary.constellation_coverage).length > 0 && (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                            <strong>Active Constellations:</strong>
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {Object.entries(summary.constellation_coverage)
                                                                .sort(([,a], [,b]) => b - a)
                                                                .slice(0, 4)
                                                                .map(([constellation, count]) => (
                                                                    <Box key={constellation} sx={{ 
                                                                        px: 1, 
                                                                        py: 0.5, 
                                                                        backgroundColor: 'rgba(255,255,255,0.05)', 
                                                                        borderRadius: 1,
                                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                                    }}>
                                                                        <Typography variant="body2" sx={{ color: '#feda6a', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                                            {constellation}
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.6rem' }}>
                                                                            {count} images
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                        </Box>
                                                    </Box>
                                                )}

                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                        <strong>Fleet Diversity:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                        {summary.constellation_coverage ? 
                                                            `${Object.keys(summary.constellation_coverage).length} different satellite systems providing redundancy` : 
                                                            'Single satellite system'}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </StatCard>

                                        {/* Satellite Intelligence Summary */}
                                        <StatCard>
                                            <CardContent sx={{ p: 1 }}>
                                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                    🔍 Intelligence Summary
                                                </Typography>
                                                
                                                <Box sx={{ mb: 1 }}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                        <strong>Monitoring Status:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ 
                                                        color: summary.total_features > 15 ? '#2ecc71' : 
                                                               summary.total_features > 8 ? '#f39c12' : '#e74c3c', 
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {summary.total_features > 15 ? 'ACTIVE MONITORING' : 
                                                         summary.total_features > 8 ? 'MODERATE MONITORING' : 'LIMITED MONITORING'}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ mb: 1 }}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                        <strong>Intelligence Value:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                        {summary.average_cloud_cover < 30 && summary.average_resolution < 3 ? 'High - Clear imagery with detailed resolution' :
                                                         summary.average_cloud_cover < 50 && summary.average_resolution < 5 ? 'Medium - Adequate for detailed analysis' :
                                                         'Low - Limited by cloud cover or resolution'}
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                        <strong>Recommendation:</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                        {summary.total_features < 5 ? 'Increase monitoring frequency for better coverage' :
                                                         summary.average_cloud_cover > 40 ? 'Consider additional passes during clear weather' :
                                                         'Current monitoring provides adequate coverage'}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </StatCard>

                                        {/* Anomaly Detection & Pattern Analysis */}
                                        <StatCard>
                                            <CardContent sx={{ p: 1 }}>
                                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#feda6a' }}>
                                                    🚨 Anomaly Detection & Pattern Analysis
                                                </Typography>
                                                
                                                {summary.features_per_year && (
                                                    <>
                                                        {/* Monitoring Spike Detection */}
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                                <strong>Monitoring Activity Spikes:</strong>
                                                            </Typography>
                                                            {(() => {
                                                                const yearData = Object.entries(summary.features_per_year);
                                                                const totalImages = yearData.reduce((sum, [, months]) => 
                                                                    sum + Object.values(months).reduce((mSum, count) => mSum + count, 0), 0);
                                                                const avgImagesPerYear = totalImages / yearData.length;
                                                                
                                                                const spikes = yearData.filter(([year, months]) => {
                                                                    const yearTotal = Object.values(months).reduce((sum, count) => sum + count, 0);
                                                                    return yearTotal > avgImagesPerYear * 1.5; // 50% above average
                                                                });
                                                                
                                                                if (spikes.length > 0) {
                                                                    return (
                                                                        <Box>
                                                                            {spikes.map(([year, months]) => {
                                                                                const yearTotal = Object.values(months).reduce((sum, count) => sum + count, 0);
                                                                                const increase = ((yearTotal - avgImagesPerYear) / avgImagesPerYear * 100).toFixed(0);
                                                                                return (
                                                                                    <Box key={year} sx={{ 
                                                                                        mb: 0.5, 
                                                                                        p: 0.5, 
                                                                                        backgroundColor: 'rgba(231, 76, 60, 0.1)', 
                                                                                        borderRadius: 0.5,
                                                                                        border: '1px solid rgba(231, 76, 60, 0.3)'
                                                                                    }}>
                                                                                        <Typography variant="body2" sx={{ color: '#e74c3c', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                                                            🚨 {year}: {yearTotal} images (+{increase}% above average)
                                                                                        </Typography>
                                                                                        <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.6rem' }}>
                                                                                            Potential area of interest or increased monitoring activity
                                                                                        </Typography>
                                                                                    </Box>
                                                                                );
                                                                            })}
                                                                        </Box>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <Typography variant="body2" sx={{ color: '#2ecc71', fontSize: '0.7rem' }}>
                                                                            ✅ No significant monitoring spikes detected
                                                                        </Typography>
                                                                    );
                                                                }
                                                            })()}
                                                        </Box>

                                                        {/* Monthly Pattern Analysis */}
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                                <strong>Monthly Activity Patterns:</strong>
                                                            </Typography>
                                                            {(() => {
                                                                const allMonths = {};
                                                                Object.values(summary.features_per_year).forEach(months => {
                                                                    Object.entries(months).forEach(([month, count]) => {
                                                                        allMonths[month] = (allMonths[month] || 0) + count;
                                                                    });
                                                                });
                                                                
                                                                const avgPerMonth = Object.values(allMonths).reduce((sum, count) => sum + count, 0) / 12;
                                                                const highActivityMonths = Object.entries(allMonths)
                                                                    .filter(([, count]) => count > avgPerMonth * 1.3)
                                                                    .sort(([,a], [,b]) => b - a)
                                                                    .slice(0, 3);
                                                                
                                                                if (highActivityMonths.length > 0) {
                                                                    return (
                                                                        <Box>
                                                                            {highActivityMonths.map(([month, count]) => {
                                                                                const monthName = new Date(0, month - 1).toLocaleString('default', { month: 'long' });
                                                                                const increase = ((count - avgPerMonth) / avgPerMonth * 100).toFixed(0);
                                                                                return (
                                                                                    <Box key={month} sx={{ 
                                                                                        mb: 0.5, 
                                                                                        p: 0.5, 
                                                                                        backgroundColor: 'rgba(243, 156, 18, 0.1)', 
                                                                                        borderRadius: 0.5,
                                                                                        border: '1px solid rgba(243, 156, 18, 0.3)'
                                                                                    }}>
                                                                                        <Typography variant="body2" sx={{ color: '#f39c12', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                                                            📈 {monthName}: {count} images (+{increase}% above average)
                                                                                        </Typography>
                                                                                    </Box>
                                                                                );
                                                                            })}
                                                                        </Box>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <Typography variant="body2" sx={{ color: '#2ecc71', fontSize: '0.7rem' }}>
                                                                            ✅ Consistent monthly monitoring patterns
                                                                        </Typography>
                                                                    );
                                                                }
                                                            })()}
                                                        </Box>

                                                        {/* Event Correlation Analysis */}
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                                <strong>Potential Event Indicators:</strong>
                                                            </Typography>
                                                            {(() => {
                                                                const yearData = Object.entries(summary.features_per_year);
                                                                const recentYear = yearData[yearData.length - 1];
                                                                const previousYear = yearData[yearData.length - 2];
                                                                
                                                                if (recentYear && previousYear) {
                                                                    const recentTotal = Object.values(recentYear[1]).reduce((sum, count) => sum + count, 0);
                                                                    const previousTotal = Object.values(previousYear[1]).reduce((sum, count) => sum + count, 0);
                                                                    const change = ((recentTotal - previousTotal) / previousTotal * 100).toFixed(0);
                                                                    
                                                                    if (Math.abs(change) > 30) {
                                                                        return (
                                                                            <Box sx={{ 
                                                                                p: 0.5, 
                                                                                backgroundColor: change > 0 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', 
                                                                                borderRadius: 0.5,
                                                                                border: `1px solid ${change > 0 ? 'rgba(231, 76, 60, 0.3)' : 'rgba(46, 204, 113, 0.3)'}`
                                                                            }}>
                                                                                <Typography variant="body2" sx={{ 
                                                                                    color: change > 0 ? '#e74c3c' : '#2ecc71', 
                                                                                    fontSize: '0.7rem', 
                                                                                    fontWeight: 'bold' 
                                                                                }}>
                                                                                    {change > 0 ? '🚨' : '📉'} {recentYear[0]} vs {previousYear[0]}: {change > 0 ? '+' : ''}{change}% change
                                                                                </Typography>
                                                                                <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.6rem' }}>
                                                                                    {change > 0 ? 
                                                                                        'Significant increase may indicate heightened area of interest or operational changes' :
                                                                                        'Decrease may indicate reduced monitoring priority or operational changes'}
                                                                                </Typography>
                                                                            </Box>
                                                                        );
                                                                    }
                                                                }
                                                                
                                                                return (
                                                                    <Typography variant="body2" sx={{ color: '#2ecc71', fontSize: '0.7rem' }}>
                                                                        ✅ Stable monitoring levels - no significant changes detected
                                                                    </Typography>
                                                                );
                                                            })()}
                                                        </Box>

                                                        {/* Seasonal Analysis */}
                                                        <Box>
                                                            <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem', mb: 0.5 }}>
                                                                <strong>Seasonal Monitoring Patterns:</strong>
                                                            </Typography>
                                                            {(() => {
                                                                const seasons = {
                                                                    'Winter': [12, 1, 2],
                                                                    'Spring': [3, 4, 5],
                                                                    'Summer': [6, 7, 8],
                                                                    'Fall': [9, 10, 11]
                                                                };
                                                                
                                                                const seasonalData = {};
                                                                Object.entries(seasons).forEach(([season, months]) => {
                                                                    seasonalData[season] = months.reduce((sum, month) => {
                                                                        const allMonths = {};
                                                                        Object.values(summary.features_per_year).forEach(yearMonths => {
                                                                            Object.entries(yearMonths).forEach(([m, count]) => {
                                                                                allMonths[m] = (allMonths[m] || 0) + count;
                                                                            });
                                                                        });
                                                                        return sum + (allMonths[month] || 0);
                                                                    }, 0);
                                                                });
                                                                
                                                                const maxSeason = Object.entries(seasonalData).reduce((max, [season, count]) => 
                                                                    count > max.count ? { season, count } : max, { season: '', count: 0 });
                                                                
                                                                return (
                                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.7rem' }}>
                                                                        Peak monitoring: <strong style={{ color: '#feda6a' }}>{maxSeason.season}</strong> ({maxSeason.count} images)
                                                                        {maxSeason.season === 'Summer' ? ' - Optimal weather conditions for imaging' :
                                                                         maxSeason.season === 'Winter' ? ' - Potential area of strategic interest' : ''}
                                                                    </Typography>
                                                                );
                                                            })()}
                                                        </Box>
                                                    </>
                                                )}
                                            </CardContent>
                                        </StatCard>
                                    </>
                                )}
                            </Box>
                        )}
                        {tabIndex === 3 && selectedMarker && (
                            <>
                                {/* Header Section */}
                                <Box sx={{ mb: 2, pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700, color: '#feda6a', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                        📰 News Intelligence
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#d4d4dc', opacity: 0.8, fontSize: '0.75rem' }}>
                                        Latest developments for {selectedMarker.name}
                                    </Typography>
                                </Box>
                                
                                {/* Topic Filter Section */}
                                <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#feda6a', fontWeight: 600, fontSize: '0.7rem' }}>
                                            Topic:
                                        </Typography>
                                        <Select
                                            value={selectedTopic}
                                            onChange={e => setSelectedTopic(e.target.value)}
                                            size="small"
                                            sx={{ 
                                                minWidth: 120, 
                                                background: 'rgba(255,255,255,0.05)', 
                                                color: '#feda6a', 
                                                borderRadius: 0.5,
                                                fontSize: '0.7rem',
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: 'rgba(254, 218, 106, 0.3)',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'rgba(254, 218, 106, 0.5)',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#feda6a',
                                                    },
                                                },
                                                '& .MuiSelect-select': {
                                                    padding: '4px 8px',
                                                    fontSize: '0.7rem',
                                                },
                                                '& .MuiMenu-paper': {
                                                    backgroundColor: '#1d1e22',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                                },
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backgroundColor: '#1d1e22',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                                        '& .MuiMenuItem-root': {
                                                            color: '#d4d4dc',
                                                            fontSize: '0.7rem',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(254, 218, 106, 0.1)',
                                                            },
                                                            '&.Mui-selected': {
                                                                backgroundColor: 'rgba(254, 218, 106, 0.2)',
                                                                color: '#feda6a',
                                                                fontWeight: 600,
                                                            },
                                                        },
                                                    },
                                                },
                                            }}
                                        >
                                            {NEWS_TOPICS.map(topic => (
                                                <MenuItem key={topic} value={topic}>{topic}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Box>

                                {/* News Content Section */}
                                <Box sx={{ 
                                    backgroundColor: 'rgba(255,255,255,0.02)', 
                                    borderRadius: 1, 
                                    p: 1.5,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    minHeight: 150
                                }}>
                                    {(() => {
                                        if (newsLoading) {
                                            return (
                                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', mb: 0.5, fontSize: '0.8rem' }}>
                                                        🔍 Searching for news articles...
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', opacity: 0.7, fontSize: '0.7rem' }}>
                                                        Analyzing recent developments
                                                    </Typography>
                                                </Box>
                                            );
                                        }
                                        
                                        if (newsError) {
                                            return (
                                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                                    <Typography variant="body2" sx={{ color: '#e74c3c', mb: 0.5, fontWeight: 600, fontSize: '0.8rem' }}>
                                                        ⚠️ News Service Error
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.75rem' }}>
                                                        {newsError}
                                                    </Typography>
                                                </Box>
                                            );
                                        }
                                        
                                        if (newsArticles.length === 0) {
                                            return (
                                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', mb: 0.5, fontWeight: 600, fontSize: '0.8rem' }}>
                                                        📭 No Articles Found
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', opacity: 0.7, fontSize: '0.75rem' }}>
                                                        No recent news articles found for this location.
                                                    </Typography>
                                                </Box>
                                            );
                                        }
                                        
                                        return (
                                            <>
                                                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ color: '#feda6a', fontWeight: 600, fontSize: '0.75rem' }}>
                                                        📊 Found {newsArticles.length} articles
                                                    </Typography>
                                                    <Box sx={{ 
                                                        width: 6, 
                                                        height: 6, 
                                                        borderRadius: '50%', 
                                                        backgroundColor: '#2ecc71',
                                                        animation: 'pulse 2s infinite'
                                                    }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {newsArticles.map((article, idx) => (
                                                        <Box 
                                                            key={idx} 
                                                            sx={{ 
                                                                p: 1.5, 
                                                                backgroundColor: 'rgba(255,255,255,0.04)', 
                                                                borderRadius: 1, 
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                                                    borderColor: 'rgba(254, 218, 106, 0.3)',
                                                                    transform: 'translateY(-1px)',
                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                                }
                                                            }}
                                                        >
                                                            {/* Article Header */}
                                                            <Box sx={{ mb: 1 }}>
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        color: '#feda6a', 
                                                                        fontWeight: 600, 
                                                                        fontSize: '0.8rem',
                                                                        lineHeight: 1.3,
                                                                        mb: 0.5,
                                                                        '& a': {
                                                                            color: '#feda6a',
                                                                            textDecoration: 'none',
                                                                            transition: 'color 0.2s ease',
                                                                            '&:hover': {
                                                                                color: '#f1c40f',
                                                                                textDecoration: 'underline'
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    <a href={article.link} target="_blank" rel="noopener noreferrer">
                                                                        {article.title ? article.title.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : 'Untitled'}
                                                                    </a>
                                                                </Typography>
                                                                
                                                                {/* Source and Date */}
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                                    {article.source && (
                                                                        <Box sx={{ 
                                                                            px: 0.5, 
                                                                            py: 0.125, 
                                                                            backgroundColor: 'rgba(254, 218, 106, 0.1)', 
                                                                            borderRadius: 0.25,
                                                                            border: '1px solid rgba(254, 218, 106, 0.2)'
                                                                        }}>
                                                                            <Typography variant="body2" sx={{ color: '#feda6a', fontSize: '0.6rem', fontWeight: 600 }}>
                                                                                {article.source}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                    <Typography variant="body2" sx={{ color: '#d4d4dc', fontSize: '0.6rem', opacity: 0.8 }}>
                                                                        {article.published}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            
                                                            {/* Article Summary */}
                                                            {article.summary && (
                                                                <Box sx={{ 
                                                                    p: 1, 
                                                                    backgroundColor: 'rgba(255,255,255,0.02)', 
                                                                    borderRadius: 0.5,
                                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                                }}>
                                                                    <Typography 
                                                                        variant="body2" 
                                                                        sx={{ 
                                                                            color: '#d4d4dc', 
                                                                            fontSize: '0.7rem',
                                                                            lineHeight: 1.4,
                                                                            opacity: 0.9
                                                                        }}
                                                                        dangerouslySetInnerHTML={{ 
                                                                            __html: article.summary.replace(/<a[^>]*>/g, '').replace(/<\/a>/g, '').replace(/<font[^>]*>/g, '').replace(/<\/font>/g, '') 
                                                                        }}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </>
                                        );
                                    })()}
                                </Box>
                            </>
                        )}
                    </Box>
                </>
            ) : null}
        </StyledPaper>
    );
};

export default StatisticBar;
