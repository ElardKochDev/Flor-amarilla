import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Si algo falla, ofrece reiniciar en lugar de dejar la pantalla en blanco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[jardin] error inesperado', error);
  }

  private reset = () => {
    try {
      localStorage.removeItem('jardin-de-nazrit:v1');
    } catch {
      /* ignorar */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="modal-backdrop">
        <div className="modal card">
          <h2>Ups, una hojita se cayó 🍂</h2>
          <p>Algo salió mal. Puedes reiniciar el jardín y volver a intentarlo.</p>
          <button className="btn btn-primary" onClick={this.reset}>
            Reiniciar
          </button>
        </div>
      </div>
    );
  }
}
