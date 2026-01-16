import { IconMail, IconMapPin, IconPhone } from '../components/Icon'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

export default function ContactPage() {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main>
        <section className="public-hero public-hero-compact">
          <div className="container contact-hero-grid">
            <div className="contact-hero-copy">
              <span className="ds-eyebrow">Contatti</span>
              <h1 className="hero-title">Parliamo del tuo portale sanitario.</h1>
              <p className="hero-subtitle">
                Raccontaci il tuo progetto: possiamo creare un flusso su misura per cliniche, poliambulatori e
                strutture multi sede.
              </p>
              <div className="contact-references">
                <div className="contact-reference">
                  <div className="contact-icon contact-icon-mail">
                    <IconMail size={18} />
                  </div>
                  <div>
                    <div className="contact-title">Email</div>
                    <div className="contact-value">support@example.com</div>
                  </div>
                </div>
                <div className="contact-reference">
                  <div className="contact-icon contact-icon-phone">
                    <IconPhone size={18} />
                  </div>
                  <div>
                    <div className="contact-title">Telefono</div>
                    <div className="contact-value">+39 02 1234 5678</div>
                  </div>
                </div>
                <div className="contact-reference">
                  <div className="contact-icon contact-icon-pin">
                    <IconMapPin size={18} />
                  </div>
                  <div>
                    <div className="contact-title">Sede</div>
                    <div className="contact-value">Milano, Italia</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
