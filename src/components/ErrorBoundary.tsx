import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    try {
      console.error(error)
    } catch {}
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    const isDev = typeof import.meta !== 'undefined' && !!(import.meta as any)?.env?.DEV

    return (
      <div className="app-shell">
        <div className="card p-3 shadow-sm" style={{ maxWidth: 720, margin: '24px auto' }}>
          <h2 style={{ marginTop: 0 }}>Si è verificato un errore</h2>
          <div className="label" style={{ marginBottom: 12 }}>
            Riprova o ricarica la pagina. Se il problema persiste, contatta il supporto.
          </div>
          {isDev && (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, opacity: 0.9 }}>
              {String(this.state.error?.stack || this.state.error?.message)}
            </pre>
          )}
          <div className="d-flex" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-outline-secondary" type="button" onClick={this.reset}>
              Riprova
            </button>
            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
              Ricarica pagina
            </button>
          </div>
        </div>
      </div>
    )
  }
}
