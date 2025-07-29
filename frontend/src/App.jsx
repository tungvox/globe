import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import { AppProvider } from './contexts/AppContext';
import StatisticBar from './components/StatisticBar';
import { useAppContext } from './contexts/AppContext';
import Box from '@mui/material/Box';

function AppContent() {
  const { selectedMarker } = useAppContext();

  return (
    <Sidebar>
      <Box sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <MapComponent />
        <StatisticBar />
      </Box>
    </Sidebar>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
