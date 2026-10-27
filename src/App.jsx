import { useState } from 'react'

function App() {
  const [enabled, setEnabled] = useState(false)

  return (
    <main className="page">
      <section className="card" aria-labelledby="page-title">
        <p className="eyebrow">Home Assistant-inspired starter</p>
        <h1 id="page-title">HaButtons</h1>
        <p className="description">
          A small React starting point for building your buttons.
        </p>
        <button
          className="toggle"
          type="button"
          aria-pressed={enabled}
          onClick={() => setEnabled((current) => !current)}
        >
          <span className="toggle-icon" aria-hidden="true">●</span>
          Preview button
          <span className="toggle-state">{enabled ? 'On' : 'Off'}</span>
        </button>
        <p className="hint">This preview is local and is not connected to Home Assistant.</p>
      </section>
    </main>
  )
}

export default App
