import { createTheme } from '@mui/material/styles'

type Mode = 'light' | 'dark'

export function getMuiTheme(mode: Mode) {
  const isDark = mode === 'dark'
  const palette = {
    mode,
    primary: { main: isDark ? '#38bdf8' : '#0ea5e9' },
    secondary: { main: isDark ? '#9ca3af' : '#4b5563' },
    error: { main: isDark ? '#f87171' : '#dc2626' },
    background: {
      default: isDark ? '#0a0f1c' : '#f4f6fb',
      paper: isDark ? '#0b1220' : '#ffffff',
    },
    text: {
      primary: isDark ? '#e5e7eb' : '#0b1220',
      secondary: isDark ? '#9ca3af' : '#4b5563',
    },
    divider: isDark ? '#1f2937' : '#e2e8f0',
  }

  return createTheme({
    palette,
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Manrope", "Segoe UI", sans-serif',
      h1: { fontFamily: '"Fraunces", "Times New Roman", serif' },
      h2: { fontFamily: '"Fraunces", "Times New Roman", serif' },
      h3: { fontFamily: '"Fraunces", "Times New Roman", serif' },
      h4: { fontFamily: '"Fraunces", "Times New Roman", serif' },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            border: `1px solid ${palette.divider}`,
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
            backgroundImage: 'none',
          },
        },
      },
      MuiPickersPopper: {
        styleOverrides: {
          paper: {
            padding: 6,
          },
        },
      },
      MuiDigitalClock: {
        styleOverrides: {
          root: {
            padding: '2px 0',
          },
          item: {
            borderRadius: 8,
            padding: '6px 10px',
            minHeight: 32,
            fontSize: 13,
          },
        },
      },
      MuiPickersLayout: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiPickersCalendarHeader: {
        styleOverrides: {
          root: {
            padding: '4px 6px',
            marginBottom: 4,
          },
        },
      },
      MuiPickersToolbar: {
        styleOverrides: {
          root: {
            padding: '8px 12px',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.paper,
            borderRadius: 10,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary.main,
              boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.25)',
            },
          },
          input: {
            padding: '10px 12px',
            fontSize: 14,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          },
        },
      },
      MuiPickersDay: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  })
}
