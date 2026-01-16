import { useThemeContext } from '../theme/ThemeContext'
import { IconMoon, IconSun } from './Icon'

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useThemeContext()
  const isDark = theme === 'dark'
  const label = isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'
  return (
    <button
      className="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
    >
      <span aria-hidden="true" className="btn-icon">
        {isDark ? (
          <IconSun className="theme-toggle-icon theme-toggle-icon-sun" size={20} />
        ) : (
          <IconMoon className="theme-toggle-icon theme-toggle-icon-moon" size={20} />
        )}
      </span>
    </button>
  )
}
