export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container public-footer-row">
        <div>
          <div className="public-footer-title">PrivilegedHealthHub</div>
          <div className="public-footer-subtitle">Soluzioni digitali per il percorso clinico.</div>
        </div>
        <div className="public-footer-meta">
          © {new Date().getFullYear()} P-HealthHub. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  )
}
