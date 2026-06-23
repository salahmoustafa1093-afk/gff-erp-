import { createTheme, type ThemeOptions } from '@mui/material/styles';
import type { PaletteOptions } from '@mui/material/styles/createPalette';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
  interface TypeBackground {
    paper: string;
    default: string;
    elevated: string;
  }
}

const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
    main: '#2E7D32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  secondary: {
    50: '#fffde7',
    100: '#fff9c4',
    200: '#fff59d',
    300: '#fff176',
    400: '#ffee58',
    500: '#ffeb3b',
    600: '#fdd835',
    700: '#fbc02d',
    800: '#f9a825',
    900: '#f57f17',
    main: '#F9A825',
    light: '#ffeb3b',
    dark: '#f57f17',
    contrastText: '#212121',
  },
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ED6C02',
    light: '#FF9800',
    dark: '#E65100',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0288D1',
    light: '#03A9F4',
    dark: '#01579B',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20',
    contrastText: '#ffffff',
  },
  neutral: {
    main: '#9E9E9E',
    light: '#BDBDBD',
    dark: '#616161',
    contrastText: '#212121',
  },
  text: {
    primary: '#212121',
    secondary: '#616161',
    disabled: '#9E9E9E',
  },
  background: {
    default: '#F5F5F5',
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  divider: '#E0E0E0',
  action: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(46, 125, 50, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
    focus: 'rgba(46, 125, 50, 0.12)',
  },
};

const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: {
    fontSize: '2.5rem',
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0em',
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0em',
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'none' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase' as const,
  },
};

const shape = {
  borderRadius: 8,
};

const spacing = 8;

const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
};

const shadows = [
  'none',
  '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
  '0px 3px 6px rgba(0,0,0,0.16), 0px 3px 6px rgba(0,0,0,0.23)',
  '0px 10px 20px rgba(0,0,0,0.19), 0px 6px 6px rgba(0,0,0,0.23)',
  '0px 14px 28px rgba(0,0,0,0.25), 0px 10px 10px rgba(0,0,0,0.22)',
  '0px 19px 38px rgba(0,0,0,0.30), 0px 15px 12px rgba(0,0,0,0.22)',
  '0 3px 5px -1px rgba(0,0,0,0.2),0 6px 10px 0 rgba(0,0,0,0.14),0 1px 18px 0 rgba(0,0,0,0.12)',
  '0 4px 5px -2px rgba(0,0,0,0.2),0 7px 10px 1px rgba(0,0,0,0.14),0 2px 16px 1px rgba(0,0,0,0.12)',
  '0 5px 5px -3px rgba(0,0,0,0.2),0 8px 10px 1px rgba(0,0,0,0.14),0 3px 14px 2px rgba(0,0,0,0.12)',
  '0 5px 6px -3px rgba(0,0,0,0.2),0 9px 12px 1px rgba(0,0,0,0.14),0 3px 16px 2px rgba(0,0,0,0.12)',
  '0 6px 6px -3px rgba(0,0,0,0.2),0 10px 14px 1px rgba(0,0,0,0.14),0 4px 18px 3px rgba(0,0,0,0.12)',
  '0 6px 7px -4px rgba(0,0,0,0.2),0 11px 15px 1px rgba(0,0,0,0.14),0 4px 20px 3px rgba(0,0,0,0.12)',
  '0 7px 8px -4px rgba(0,0,0,0.2),0 12px 17px 2px rgba(0,0,0,0.14),0 5px 22px 4px rgba(0,0,0,0.12)',
  '0 7px 8px -4px rgba(0,0,0,0.2),0 13px 19px 2px rgba(0,0,0,0.14),0 5px 24px 4px rgba(0,0,0,0.12)',
  '0 7px 9px -4px rgba(0,0,0,0.2),0 14px 21px 2px rgba(0,0,0,0.14),0 5px 26px 4px rgba(0,0,0,0.12)',
  '0 8px 9px -5px rgba(0,0,0,0.2),0 15px 22px 2px rgba(0,0,0,0.14),0 6px 28px 5px rgba(0,0,0,0.12)',
  '0 8px 10px -5px rgba(0,0,0,0.2),0 16px 24px 2px rgba(0,0,0,0.14),0 6px 30px 5px rgba(0,0,0,0.12)',
  '0 8px 11px -5px rgba(0,0,0,0.2),0 17px 26px 2px rgba(0,0,0,0.14),0 6px 32px 5px rgba(0,0,0,0.12)',
  '0 9px 11px -5px rgba(0,0,0,0.2),0 18px 28px 2px rgba(0,0,0,0.14),0 7px 34px 6px rgba(0,0,0,0.12)',
  '0 9px 12px -6px rgba(0,0,0,0.2),0 19px 29px 2px rgba(0,0,0,0.14),0 7px 36px 6px rgba(0,0,0,0.12)',
  '0 10px 13px -6px rgba(0,0,0,0.2),0 20px 31px 3px rgba(0,0,0,0.14),0 8px 38px 7px rgba(0,0,0,0.12)',
  '0 10px 13px -6px rgba(0,0,0,0.2),0 21px 33px 3px rgba(0,0,0,0.14),0 8px 40px 7px rgba(0,0,0,0.12)',
  '0 10px 14px -6px rgba(0,0,0,0.2),0 22px 35px 3px rgba(0,0,0,0.14),0 8px 42px 7px rgba(0,0,0,0.12)',
  '0 11px 14px -7px rgba(0,0,0,0.2),0 23px 36px 3px rgba(0,0,0,0.14),0 9px 44px 8px rgba(0,0,0,0.12)',
  '0 11px 15px -7px rgba(0,0,0,0.2),0 24px 38px 3px rgba(0,0,0,0.14),0 9px 46px 8px rgba(0,0,0,0.12)',
];

const components: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: {
      html: {
        scrollBehavior: 'smooth',
      },
      body: {
        margin: 0,
        padding: 0,
        backgroundColor: '#F5F5F5',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
        },
      },
      containedPrimary: {
        backgroundColor: '#2E7D32',
        '&:hover': {
          backgroundColor: '#1B5E20',
        },
      },
      containedSecondary: {
        backgroundColor: '#F9A825',
        color: '#212121',
        '&:hover': {
          backgroundColor: '#F57F17',
        },
      },
      sizeSmall: {
        padding: '4px 12px',
        fontSize: '0.8125rem',
      },
      sizeMedium: {
        padding: '6px 16px',
      },
      sizeLarge: {
        padding: '10px 24px',
        fontSize: '1rem',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          '& fieldset': {
            borderColor: '#E0E0E0',
          },
          '&:hover fieldset': {
            borderColor: '#2E7D32',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#2E7D32',
          },
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
        transition: 'box-shadow 0.25s ease-in-out',
        '&:hover': {
          boxShadow: '0px 4px 6px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.06)',
        },
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: '20px 24px 0',
      },
      title: {
        fontSize: '1.125rem',
        fontWeight: 500,
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
        '&:last-child': {
          paddingBottom: 24,
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#FFFFFF',
        color: '#212121',
        boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E0E0E0',
      },
    },
  },
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: 'none',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#F5F5F5',
          borderBottom: '2px solid #E0E0E0',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 600,
          color: '#424242',
        },
        '& .MuiDataGrid-row:nth-of-type(even)': {
          backgroundColor: '#FAFAFA',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: '#E8F5E9',
        },
        '& .MuiDataGrid-cell:focus': {
          outline: 'none',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: '12px 16px',
        fontSize: '0.875rem',
      },
      head: {
        fontWeight: 600,
        backgroundColor: '#F5F5F5',
        color: '#424242',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
        fontSize: '0.8125rem',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 6,
        fontSize: '0.8125rem',
        padding: '8px 12px',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: {
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
      },
      elevation2: {
        boxShadow: '0px 3px 6px rgba(0,0,0,0.16), 0px 3px 6px rgba(0,0,0,0.23)',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '2px 8px',
        '&.Mui-selected': {
          backgroundColor: 'rgba(46, 125, 50, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(46, 125, 50, 0.12)',
          },
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontWeight: 500,
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontSize: '0.75rem',
        fontWeight: 600,
      },
    },
  },
};

export const themeOptions: ThemeOptions = {
  palette,
  typography,
  shape,
  spacing,
  breakpoints,
  shadows: shadows as ThemeOptions['shadows'],
  components,
};

export const theme = createTheme(themeOptions);

export const darkTheme = createTheme({
  ...themeOptions,
  palette: {
    ...palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
      elevated: '#2d2d2d',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
});

export default theme;