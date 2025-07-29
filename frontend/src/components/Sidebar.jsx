import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TuneIcon from '@mui/icons-material/Tune';
import Switch from '@mui/material/Switch';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Navbar from './Navbar';
import RoomIcon from '@mui/icons-material/Room';
import { useAppContext } from '../contexts/AppContext';
import TextField from '@mui/material/TextField';

const drawerWidth = 150;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  minHeight: '48px !important',
  height: '48px !important',
  '& .MuiToolbar-root': {
    minHeight: '48px !important',
    height: '48px !important',
  }
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
      position: 'absolute',
      overflowX: 'hidden',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      ...(open && {
        width: drawerWidth,
      }),
      ...(!open && {
        width: `calc(${theme.spacing(7)} + 1px)`,
        [theme.breakpoints.up('sm')]: {
          width: `calc(${theme.spacing(8)} + 1px)`,
        },
      }),
    },
  }),
);

const SubDrawer = styled(MuiDrawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    position: 'absolute',
    left: drawerWidth,
    border: 'none',
    borderLeft: `1px solid ${theme.palette.divider}`,
  },
}));

const Sidebar = ({ children }) => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [activeSubDrawer, setActiveSubDrawer] = React.useState(null);
  const { markers, setSelectedMarker } = useAppContext();
  const [filters, setFilters] = React.useState({
    capitals: true,
    cities: false,
    landmarks: false,
    parks: false,
    museums: false,
  });
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
    setActiveSubDrawer(null);
  };

  const handleFilterMenuClick = () => {
    if (!open) {
      setOpen(true);
    }
    setActiveSubDrawer(activeSubDrawer === 'filters' ? null : 'filters');
  };

  const handleMarkerListClick = () => {
    if (!open) {
      setOpen(true);
    }
    setActiveSubDrawer(activeSubDrawer === 'markers' ? null : 'markers');
  };

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredMarkers = Array.from(markers).filter(marker => 
    marker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navbar open={open} handleDrawerOpen={handleDrawerOpen} />
      <Box component="main" sx={{ flexGrow: 1, height: '100vh', position: 'relative' }}>
        <DrawerHeader />
        {children}
        <Drawer 
          variant="permanent" 
          open={open}
          sx={{
            '& .MuiDrawer-paper': {
              zIndex: theme => theme.zIndex.drawer,
              backgroundColor: 'secondary.main'
            }
          }}
        >
          <DrawerHeader>
            <IconButton 
              sx={{
                color: 'primary.silverFox'
              }}
              onClick={handleDrawerClose 
            }>
              {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List 
            sx={{
              pt: 0
            }}
          >
            {/* <ListItem disablePadding sx={{ display: 'flex' }}>
              <ListItemButton
                onClick={handleFilterMenuClick}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  backgroundColor: activeSubDrawer === 'filters' ? 'rgba(0, 0, 0, 0.08)' : 'inherit',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <TuneIcon />
                </ListItemIcon>
                <ListItemText primary="Filters" sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem> */}
            <ListItem disablePadding sx={{ display: 'flex' }}>
              <ListItemButton
                onClick={handleMarkerListClick}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  backgroundColor: activeSubDrawer === 'markers' ? 'primary.main' : 'inherit',
                  ":hover": { 
                    backgroundColor: 'primary.main'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: 'primary.yellow'
                  }}
                >
                  <RoomIcon />
                </ListItemIcon>
                <ListItemText primary="Markers" sx={{ opacity: open ? 1 : 0, color: 'text.third' }} />
              </ListItemButton>
            </ListItem>
          </List>

        </Drawer>
        <SubDrawer
          variant="persistent"
          open={open && activeSubDrawer === 'markers'}
          anchor="left"
          sx={{
            '& .MuiDrawer-paper': {
              zIndex: theme => theme.zIndex.drawer - 1,
              width: '240px',
            },
          }}
        >
          <List sx={{ marginTop: '48px' }}>
            <ListItem>
              <TextField
                label="Search Markers"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </ListItem>
            {filteredMarkers.map((marker, index) => (
              <ListItem key={index} sx={{ cursor: 'pointer' }} onClick={() => setSelectedMarker(marker)}>
                <ListItemText 
                  primary={marker.name} 
                  secondary={`Lat: ${marker.getLngLat().lat.toFixed(4)}, Lng: ${marker.getLngLat().lng.toFixed(4)}`}
                />

              </ListItem>
            ))}
          </List>
        </SubDrawer>
        <SubDrawer
          variant="persistent"
          open={open && activeSubDrawer === 'filters'}
          anchor="left"
          sx={{
            '& .MuiDrawer-paper': {
              zIndex: theme => theme.zIndex.drawer - 1,
            },
          }}
        >
          <List sx={{ marginTop: '48px' }}>
            {Object.entries(filters).map(([key, value]) => (
              <ListItem key={key}>
                <ListItemText 
                  primary={key.charAt(0).toUpperCase() + key.slice(1)} 
                />
                <Switch
                  edge="end"
                  checked={value}
                  onChange={() => handleFilterChange(key)}
                />
              </ListItem>
            ))}
          </List>
        </SubDrawer>
      </Box>
    </Box>
  );
};

export default Sidebar;
