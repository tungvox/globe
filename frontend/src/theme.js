import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#393f4d', // Main primary color
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
      silverFox: '#d4d4dc',
      yellow: '#feda6a'
    },
    secondary: {
      main: '#1d1e22', // Main secondary color
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#5e5e5e',
      third: '#d4d4dc'
    },
  },
  // You can also customize typography, spacing, breakpoints, etc.
  typography: {
    fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    p: {
      fontWeight: 900
    }
  },
}); 