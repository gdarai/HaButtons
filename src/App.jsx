import { useEffect, useRef, useState } from 'react'
import { iconColor, parseDefinitions } from './definitions.js'
import { Icon } from './icons.js'
import { testDefinitions } from './testMode.js'

async function loadResponse(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Could not load ${url}: HTTP ${response.status}.`)
  }
  return response
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function App() {
  const [settings, setSettings] = useState(null)
  const [buttons, setButtons] = useState([])
  const [screen, setScreen] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState([])
  const [retry, setRetry] = useState(0)
  const requestId = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    const id = ++requestId.current
    let active = true
    async function initialize() {
      try {
        const options = await (await loadResponse('/api/settings', controller.signal)).json()
        if (!Number.isSafeInteger(options.columns) || options.columns < 1 || typeof options.test !== 'boolean') {
          throw new Error('Invalid settings from the local server.')
        }
        const definitions = options.test
          ? testDefinitions
          : await (await loadResponse('/api/definitions', controller.signal)).text()
        const loaded = parseDefinitions(definitions)
        if (!active || id !== requestId.current) return
        setSettings(options)
        setButtons(loaded)
        setScreen('buttons')
      } catch (error) {
        if (!active || id !== requestId.current || controller.signal.aborted) return
        setLoadError(errorMessage(error))
        setScreen('error')
      }
    }
    initialize()
    return () => {
      active = false
      controller.abort()
    }
  }, [retry])

  async function pressButton(button, index) {
    setPending((current) => [...current, index])
    setActionError('')
    try {
      const url = `/api/webhook/${encodeURIComponent(button.command)}`
      if (settings.test) {
        console.info(`POST ${url}`)
      } else {
        const response = await fetch(url, { method: 'POST' })
        if (!response.ok) {
          throw new Error(`Webhook "${button.name}" failed: HTTP ${response.status}.`)
        }
      }
    } catch (error) {
      setActionError(`Could not send "${button.name}": ${errorMessage(error)}`)
    } finally {
      setPending((current) => current.filter((value) => value !== index))
    }
  }

  return (
    <main className="page">
      {screen === 'loading' && (
        <section className="panel" aria-live="polite">
          <h1>HaButtons</h1>
          <p>Loading buttons...</p>
        </section>
      )}

      {screen === 'error' && (
        <section className="panel" aria-live="polite">
          <h1>HaButtons</h1>
          <p className="error" role="alert">{loadError}</p>
          <button type="button" className="secondary-button" onClick={() => {
            setScreen('loading')
            setRetry((current) => current + 1)
          }}>Retry</button>
        </section>
      )}

      {screen === 'buttons' && (
        <section className="buttons-panel" aria-labelledby="buttons-title">
          <header className="toolbar">
            <h1 id="buttons-title">HaButtons</h1>
          </header>
          {actionError && <p className="error" role="alert">{actionError}</p>}
          <div className="grid-scroll">
            <div className="button-grid" style={{ '--columns': settings.columns }}>
              {buttons.map((button, index) => (
                <button
                  type="button"
                  className="command-button"
                  key={index}
                  disabled={pending.includes(index)}
                  onClick={() => pressButton(button, index)}
                >
                  <span
                    className="icon-tile"
                    style={{ backgroundColor: button.color, color: iconColor(button.color) }}
                  >
                    <Icon name={button.icon} />
                  </span>
                  <span className="button-name">{button.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
