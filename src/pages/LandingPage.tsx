import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

export default function LandingPage() {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main>
        <section className="public-hero landing-hero-minimal">
          <div className="container landing-hero">
            <div className="landing-hero-copy">
              <div className="landing-kicker animate-rise" style={{ '--delay': '80ms' } as CSSProperties}>
                <span className="landing-kicker-dot" />
                PrivilegedHealthHub
              </div>
              <h1 className="landing-slogan animate-rise" style={{ '--delay': '140ms' } as CSSProperties}>
                Privileged Hub, dove le visite sono un privilegio per tutti
              </h1>
              <p className="landing-lead animate-rise" style={{ '--delay': '200ms' } as CSSProperties}>
                Prenotazioni, referti e supporto in uno spazio essenziale, progettato per chi vuole chiarezza subito.
              </p>
              <div className="hero-actions animate-rise" style={{ '--delay': '260ms' } as CSSProperties}>
                <Link className="ds-btn ds-btn-primary ds-btn-lg" to="/area-riservata">Entra in area riservata</Link>
                <Link className="ds-btn ds-btn-ghost ds-btn-lg" to="/contatti">Assistenza e contatti</Link>
              </div>
            </div>
            <div className="landing-hero-card animate-rise" style={{ '--delay': '360ms' } as CSSProperties}>
              <ul className="landing-card-list">
                <li>Notifiche mirate e tempi chiari</li>
                <li>Documenti pronti in pochi passaggi</li>
                <li>Supporto sempre visibile</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="public-section landing-section-minimal">
          <div className="container">
            <div className="landing-section-header">
              <h2 className="landing-section-title">Tutto quello che serve.</h2>
            </div>
            <div className="landing-cards">
              <article className="landing-card">
                <h3>Prenotazioni chiare</h3>
                <p>Conferme rapide e disponibilità sempre leggibili.</p>
              </article>
              <article className="landing-card">
                <h3>Referti</h3>
                <p>Accesso immediato, download protetto e storico ordinato.</p>
              </article>
              <article className="landing-card">
                <h3>Supporto vicino</h3>
                <p>Canali rapidi per ricevere aiuto quando serve davvero.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="public-section">
          <div className="container landing-cta">
            <div>
              <h2>Entra ora nel tuo hub personale.</h2>
              <p>Accesso immediato e supporto dedicato quando serve.</p>
            </div>
            <div className="cta-actions">
              <Link className="ds-btn ds-btn-primary ds-btn-lg" to="/chi-siamo">Scopri chi siamo</Link>
              <Link className="ds-btn ds-btn-ghost ds-btn-lg" to="/contatti">Contatta il supporto</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
