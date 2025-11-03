import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles'
import { PaletteMode } from '@mui/material'
import React from 'react'

const ColorModeContext = React.createContext<{ mode: PaletteMode; toggle: () => void }>({ mode: 'light', toggle: () => {} })

export const useColorMode = () => React.useContext(ColorModeContext)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = React.useState<PaletteMode>(() => (localStorage.getItem('theme') as PaletteMode) || 'light')

  const theme = React.useMemo(() => createTheme({
    palette: { mode },
  }), [mode])

  const value = React.useMemo(() => ({
    mode,
    toggle: () => setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      return next
    }),
  }), [mode])

  return (
    <ColorModeContext.Provider value={value}>
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ColorModeContext.Provider>
  )
}
