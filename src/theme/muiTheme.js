import { createTheme } from '@mui/material/styles';

// Light theme that matches your current design
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#166534', // green-800 to match your current green theme
      light: '#22c55e',
      dark: '#14532d',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed', // purple to match your gradient
      light: '#a78bfa',
      dark: '#5b21b6',
    },
    background: {
      default: 'transparent', // Let your Tailwind gradient show through
      paper: 'rgba(255, 255, 255, 0.8)', // Glassmorphic effect
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12, // Rounded corners like your current design
  },
  components: {
    // Make MUI components glassmorphic by default
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // No uppercase
          fontWeight: 500,
          borderRadius: '9999px', // Fully rounded like your current buttons
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
  },
});

// Dark theme matching your dark mode
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
      light: '#f3f4f6',
      dark: '#d1d5db',
      contrastText: '#000000',
    },
    secondary: {
      main: '#60a5fa', // blue-400
      light: '#93c5fd',
      dark: '#3b82f6',
    },
    background: {
      default: 'transparent',
      paper: 'rgba(17, 24, 39, 0.8)', // gray-900 with opacity
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
          borderColor: 'rgba(75, 85, 99, 0.5)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '9999px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(17, 24, 39, 0.7)',
          borderColor: 'rgba(75, 85, 99, 0.5)',
        },
      },
    },
  },
});

export { lightTheme, darkTheme };