import LoginForm from '../components/LoginForm'
import PublicFooter from '../components/PublicFooter'
import PublicHeader from '../components/PublicHeader'

export default function AreaRiservataPage() {
  return (
    <div className="public-layout area-layout">
      <PublicHeader />
      <main>
        <section className="area-hero">
          <div className="container area-grid">
            <div className="area-copy">
              <span className="ds-eyebrow">Area riservata</span>
              <h1 className="hero-title">Accesso protetto per professionisti e pazienti.</h1>
            </div>
            <div className="area-login">
              <LoginForm
                title="Accedi al portale"
                subtitle="Inserisci le tue credenziali per continuare."
                showRegisterLink
              />
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
