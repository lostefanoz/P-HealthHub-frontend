import { useState } from 'react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

export default function AboutPage() {
  const [openItem, setOpenItem] = useState<'one' | 'two' | 'three' | ''>('')

  const toggleItem = (item: 'one' | 'two' | 'three') => {
    setOpenItem((current) => (current === item ? '' : item))
  }

  return (
    <div className="public-layout">
      <PublicHeader />
      <main>
        <section className="public-hero public-hero-compact">
          <div className="container split-grid">
            <div>
              <span className="ds-eyebrow">Chi siamo</span>
              <h1 className="hero-title">Tecnologia e cura, nella stessa direzione.</h1>
              <p className="hero-subtitle">
                PrivilegedHealthHub nasce per connettere pazienti, professionisti e strutture sanitarie con esperienze digitali
                efficaci, sicure e umane.
              </p>
            </div>
            <div className="info-panel">
              <div className="info-panel-header">Il nostro focus</div>
              <div className="info-panel-body">
                <div className="info-row">
                  <span className="info-dot" />
                  <div>
                    <div className="info-title">Esperienza utente</div>
                    <div className="info-text">Interfacce chiare che riducono lo stress operativo.</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-dot" />
                  <div>
                    <div className="info-title">Sicurezza</div>
                    <div className="info-text">Accessi protetti, audit log e gestione ruoli.</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-dot" />
                  <div>
                    <div className="info-title">Efficienza</div>
                    <div className="info-text">Workflow automatizzati e KPI sempre disponibili.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="public-section">
          <div className="container">
            <div className="section-header">
              <div className="section-icon">=</div>
              <h2>La nostra missione</h2>
            </div>
            <div className="accordion" id="aboutMissionAccordion">
              <div className="accordion-item">
                <h2 className="accordion-header" id="aboutMissionHeadingOne">
                  <button
                    className={`accordion-button${openItem === 'one' ? '' : ' collapsed'}`}
                    type="button"
                    aria-expanded={openItem === 'one'}
                    aria-controls="aboutMissionCollapseOne"
                    onClick={() => toggleItem('one')}
                  >
                    Digitalizzare con empatia
                  </button>
                </h2>
                <div
                  id="aboutMissionCollapseOne"
                  className={`accordion-collapse collapse${openItem === 'one' ? ' show' : ''}`}
                  aria-labelledby="aboutMissionHeadingOne"
                >
                  <div className="accordion-body">
                    Crediamo che la tecnologia sanitaria debba essere accessibile, rapida e orientata alle persone.
                    Progettiamo strumenti che eliminano attriti e migliorano l'esperienza di tutti.
                  </div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header" id="aboutMissionHeadingTwo">
                  <button
                    className={`accordion-button${openItem === 'two' ? '' : ' collapsed'}`}
                    type="button"
                    aria-expanded={openItem === 'two'}
                    aria-controls="aboutMissionCollapseTwo"
                    onClick={() => toggleItem('two')}
                  >
                    Collaborazione clinica
                  </button>
                </h2>
                <div
                  id="aboutMissionCollapseTwo"
                  className={`accordion-collapse collapse${openItem === 'two' ? ' show' : ''}`}
                  aria-labelledby="aboutMissionHeadingTwo"
                >
                  <div className="accordion-body">
                    Riduciamo la frammentazione delle informazioni con dashboard condivise, referti centralizzati e
                    comunicazioni rapide tra team.
                  </div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header" id="aboutMissionHeadingThree">
                  <button
                    className={`accordion-button${openItem === 'three' ? '' : ' collapsed'}`}
                    type="button"
                    aria-expanded={openItem === 'three'}
                    aria-controls="aboutMissionCollapseThree"
                    onClick={() => toggleItem('three')}
                  >
                    Decisioni guidate dai dati
                  </button>
                </h2>
                <div
                  id="aboutMissionCollapseThree"
                  className={`accordion-collapse collapse${openItem === 'three' ? ' show' : ''}`}
                  aria-labelledby="aboutMissionHeadingThree"
                >
                  <div className="accordion-body">
                    Metriche operative, tracciamento e reportistica per aiutare le direzioni sanitarie a decidere con
                    chiarezza e tempi rapidi.
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
