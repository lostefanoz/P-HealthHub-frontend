import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'

import ThemeToggleButton from './ThemeToggleButton'



export default function PublicHeader() {

  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : undefined)
  const location = useLocation()
  const isHome = location.pathname === '/'


  return (

    <header className="public-header">

      <div className="container public-header-row">

        <Link className="public-brand" to="/">

          <Logo asLink={false} />
          <span className="public-brand-text">

            <span className="public-brand-title">P-HealthHub</span>
            <span className="public-brand-subtitle">Portale sanitario</span>

          </span>

        </Link>

        <nav className="public-nav" aria-label="Navigazione principale">

          <NavLink to="/chi-siamo" className={navClass}>Chi siamo</NavLink>

          <NavLink to="/contatti" className={navClass}>Contatti</NavLink>

        </nav>

        <div className="public-actions">

          <ThemeToggleButton />

          {!isHome && (
            <Link className="ds-btn ds-btn-primary ds-btn-sm public-cta" to="/area-riservata">
              Accedi
            </Link>
          )}
        </div>

      </div>

    </header>

  )

}


