import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'

import { useEffect, useState } from 'react'

import Logo from '../components/Logo'

import ThemeToggleButton from '../components/ThemeToggleButton'

import Clock from '../components/Clock'

import ConfirmModal from '../components/ConfirmModal'
import { getMfaStatus } from '../services/authApi'



export default function DashboardLayout() {

  const { state, logout } = useAuth()
  const navigate = useNavigate()

  const user = state.step === 'AUTH' ? state.user : null

  const isAuthenticated = !!user

  const roles = user?.roles ?? []



  const isAdmin = roles.includes('Admin')

  const isDoctor = roles.includes('Doctor')

  const isPatient = roles.includes('Patient')

  const isSecretary = roles.includes('Secretary')

  const roleLabel = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'Amministratore'
      case 'Doctor':
        return 'Dottore'
      case 'Patient':
        return 'Paziente'
      case 'Secretary':
        return 'Segreteria'
      default:
        return role
    }
  }



  const [showLogout, setShowLogout] = useState(false)

  const [loginCountry, setLoginCountry] = useState<string | null>(null)

  const [loginCountryCode, setLoginCountryCode] = useState<string | null>(null)

  const [countryLoading, setCountryLoading] = useState(true)
  const [showMfaPrompt, setShowMfaPrompt] = useState(false)

  const flagCode = loginCountryCode ? loginCountryCode.toLowerCase() : null

  useEffect(() => {

    let active = true

    if (!user) return () => { active = false }

    const storageKey = `mfaPromptSeen:${user.id}`

    try {

      if (localStorage.getItem(storageKey) === '1') return () => { active = false }

    } catch {}

    ;(async () => {

      try {

        const status = await getMfaStatus()

        if (!active) return

        if (status?.enabled === false) {

          setShowMfaPrompt(true)

        }

      } catch {}

    })()

    return () => {

      active = false

    }

  }, [user?.id])

  useEffect(() => {

    let active = true

    const storageKey = 'loginCountryInfo'

    const displayNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl

      ? new Intl.DisplayNames(['it'], { type: 'region' })

      : null

    try {

      const cached = sessionStorage.getItem(storageKey)

      if (cached) {

        const parsed = JSON.parse(cached) as { name?: string | null; code?: string | null }

        setLoginCountry(parsed?.name ?? null)

        setLoginCountryCode(parsed?.code ?? null)

        setCountryLoading(false)

        return

      }

    } catch {}



    ;(async () => {

      try {

        const res = await fetch('https://ipapi.co/json/')

        if (!res.ok) throw new Error('geo lookup failed')

        const data = await res.json()

        const code = data?.country_code || data?.country || null

        const name = code && displayNames ? displayNames.of(String(code).toUpperCase()) : data?.country_name || null

        if (!active) return

        if (name) {

          setLoginCountry(name)

          setLoginCountryCode(code)

          try {

            sessionStorage.setItem(storageKey, JSON.stringify({ name, code }))

          } catch {}

        }

      } catch {

        if (active) setLoginCountry(null)

      } finally {

        if (active) setCountryLoading(false)

      }

    })()



    return () => {

      active = false

    }

  }, [])



  return (

    <div className="app-layout">

      <div className="app-topbar">

        <div className="container">

          <div className="app-topbar-row">

            <div className="app-topbar-left">

              <span className="app-topbar-brand">PrivilegedHealthHub</span>

              <span className="app-topbar-separator">•</span>

              <span className="app-topbar-meta">Area riservata</span>

            </div>

            <div className="app-topbar-right">

              <span className="app-topbar-pill">
                <span className="app-topbar-dot" aria-hidden="true" />
                {countryLoading ? (
                  'Verifica paese...'

                ) : (

                  <>

                    <span>Login:</span>

                    {flagCode && (

                      <img

                        className="app-topbar-flag"

                        src={`https://flagcdn.com/24x18/${flagCode}.png`}

                        srcSet={`https://flagcdn.com/48x36/${flagCode}.png 2x`}

                        alt={`Bandiera ${loginCountryCode?.toUpperCase()}`}

                        loading="lazy"

                      />

                    )}

                    <span>{loginCountryCode ? loginCountryCode.toUpperCase() : ''}</span>

                    <span>{loginCountry ? `- ${loginCountry}` : 'N/D'}</span>

                  </>

                )}

              </span>

            </div>

          </div>

        </div>

      </div>

      <header className="app-header">

        <div className="container">

          <a className="skip-link" href="#main">Salta al contenuto</a>

          <div className="d-flex app-header-row">

            <div className="d-flex app-header-left">

              <div className="app-brand-lockup">

                <Logo />

                <div className="app-brand">

                  <span className="app-brand-title">PrivilegedHealthHub</span>

                  <span className="app-brand-subtitle">Portale clinico</span>

                </div>

              </div>

              <Clock intervalMs={60_000} />

              <nav className="app-nav" aria-label="Navigazione principale">

                <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : undefined)}>Home</NavLink>

                {isPatient && (

                  <NavLink to="/app/prenota-visita" className={({ isActive }) => (isActive ? 'active' : undefined)}>

                    Prenota&nbsp;visita

                  </NavLink>

                )}

                {isDoctor && (

                  <NavLink to="/app/doctor/appuntamenti" className={({ isActive }) => (isActive ? 'active' : undefined)}>

                    Appuntamenti

                  </NavLink>

                )}
                {isDoctor && (
                  <NavLink to="/app/archivio-referti" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    Referti
                  </NavLink>
                )}

                {isSecretary && (
                  <NavLink to="/app/planner" className={({ isActive }) => (isActive ? 'active' : undefined)}>

                    Agenda

                  </NavLink>

                )}

                
                {isAdmin && (

                  <NavLink to="/app/admin/roles" className={({ isActive }) => (isActive ? 'active' : undefined)}>

                    Gestione utenti

                  </NavLink>

                )}

                {isAdmin && (

                  <NavLink to="/app/admin/doctor-specialties" className={({ isActive }) => (isActive ? 'active' : undefined)}>

                    Specialistiche

                  </NavLink>

                )}

                {isAdmin && (

                  <NavLink to="/app/admin/access-logs" className={({ isActive }) => (isActive ? 'active' : undefined)}>

                    Accessi

                  </NavLink>

                )}

              </nav>

            </div>



            <div className="d-flex app-header-right">

              <div className="app-header-actions">

                {isAuthenticated && (

                  <Link className="app-user-chip" to="/app/account" title="Il mio account">

                    <span className="app-user-label">
                      {roles.length > 0 && (
                        <span className="app-user-role" data-role={roles[0]}>
                          {roleLabel(roles[0])}
                        </span>
                      )}
                    </span>

                    <span className="app-user-email">
                      {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email}
                    </span>

                  </Link>

                )}

                <div className="app-header-controls">

                  <ThemeToggleButton />

                  <button className="logout-btn" type="button" onClick={() => setShowLogout(true)}>

                    <span aria-hidden="true" className="btn-icon">

                      <svg

                        className="logout-icon"

                        viewBox="0 0 24 24"

                        focusable="false"

                        aria-hidden="true"

                      >

                        <path

                          d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"

                          fill="none"

                          stroke="currentColor"

                          strokeWidth="2"

                          strokeLinecap="round"

                        />

                        <path

                          d="M13 16l4-4-4-4"

                          fill="none"

                          stroke="currentColor"

                          strokeWidth="2"

                          strokeLinecap="round"

                          strokeLinejoin="round"

                        />

                        <path

                          d="M17 12H9"

                          fill="none"

                          stroke="currentColor"

                          strokeWidth="2"

                          strokeLinecap="round"

                        />

                      </svg>

                    </span>

                    <span>Esci</span>

                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </header>



      <main className="app-main" id="main" tabIndex={-1}>

        <div className="container">

          <div className="app-main-inner">

            <Outlet />

          </div>

        </div>

      </main>



      <footer className="app-footer">
        © {new Date().getFullYear()} P-HealthHub. Tutti i diritti riservati.
      </footer>



      {showLogout && (

        <ConfirmModal

          title="Conferma uscita"

          message="Confermi di voler uscire?"

          cancelLabel="Annulla"

          confirmLabel="Esci"

          variant="danger"

          onCancel={() => setShowLogout(false)}

          onConfirm={() => {

            setShowLogout(false)

            logout()

          }}

        />

      )}

      {showMfaPrompt && (

        <ConfirmModal

          title="Proteggi il tuo account"

          message="Per la tua sicurezza, ti consigliamo di configurare l'MFA al primo accesso."

          cancelLabel="Non ora"

          confirmLabel="Configura MFA"

          onCancel={() => {

            try {

              if (user) localStorage.setItem(`mfaPromptSeen:${user.id}`, '1')

            } catch {}

            setShowMfaPrompt(false)

          }}

          onConfirm={() => {

            try {

              if (user) localStorage.setItem(`mfaPromptSeen:${user.id}`, '1')

            } catch {}

            setShowMfaPrompt(false)

            navigate('/app/account')

          }}

        />

      )}

    </div>

  )

}

