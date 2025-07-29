import React from 'react';
import { styled } from '@mui/material/styles';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 150;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Navbar = ({ open, handleDrawerOpen }) => {
  return (
    <AppBar 
      position="fixed" 
      open={open}
      sx={{
        backgroundColor: 'primary.main',
        boxShadow: 'none'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }} variant="dense">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              color: 'inherit',
              fontSize: '1.5rem'
            }}
          >
            Terramonitor
          </Typography>
        </Box>
        <Box>
          <Button 
            color="inherit"
            sx={{ 
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            Login
          </Button>
          <Button 
            color="inherit"
            sx={{ 
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            About
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
