import { useEffect, useRef, useState } from 'react'
import { baseUrl, definitionsUrl, iconColor, parseDefinitions, readSettings, saveSettings, validateColumns, webhookUrl } from './definitions.js'
import { Icon } from './icons.js'
import { isTest, testDefinitions } from './testMode.js'

async function loadButtons(settings, signal) {
  baseUrl(settings.host)
  validateColumns(settings.columns)
  if (isTest) return parseDefinitions(testDefinitions)

  const url = definitionsUrl(settings.host, settings.path)
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Could not load definitions: HTTP ${response.status}.`)
  }
  return parseDefinitions(await response.text())
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function App() {
  const [form, setForm] = useState({ host: '', path: '', columns: '2' })
  const [settings, setSettings] = useState(null)
  const [buttons, setButtons] = useState([])
  const [screen, setScreen] = useState('loading')
  const [submitting, setSubmitting] = useState(false)
  const [configError, setConfigError] = useState('')
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState([])
  const requestId = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    const id = ++requestId.current
    let active = true
    async function initialize() {
      try {
        const saved = readSettings()
        if (!active || id !== requestId.current) return
        setForm(saved)
        const loaded = await loadButtons(saved, controller.signal)
        if (!active || id !== requestId.current) return
        setSettings(saved)
        setButtons(loaded)
        setScreen('buttons')
      } catch (error) {
        if (!active || id !== requestId.current || controller.signal.aborted) return
        setConfigError(errorMessage(error))
        setScreen('config')
      }
    }
    initialize()
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  function openConfig() {
    requestId.current++
    setConfigError('')
    setScreen('config')
  }

  async function submit(event) {
    event.preventDefault()
    const next = {
      host: form.host.trim(),
      path: form.path.trim(),
      columns: form.columns.trim(),
    }
    setSubmitting(true)
    setConfigError('')
    try {
      saveSettings(next)
      const loaded = await loadButtons(next)
      setSettings(next)
      setButtons(loaded)
      setActionError('')
      setScreen('buttons')
    } catch (error) {
      setConfigError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  async function pressButton(button, index) {
    setPending((current) => [...current, index])
    setActionError('')
    try {
      const url = webhookUrl(settings.host, button.command)
      if (isTest) {
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
          <button type="button" className="secondary-button" onClick={openConfig}>Config</button>
        </section>
      )}

      {screen === 'config' && (
        <section className="panel config-panel" aria-labelledby="config-title">
          <p className="eyebrow">HaButtons</p>
          <h1 id="config-title">Config</h1>
          <p className="description">Set the Home Assistant address and button definitions file.</p>
          <form onSubmit={submit}>
            <fieldset disabled={submitting}>
              <label htmlFor="host">URL (IP:PORT)</label>
              <input
                id="host"
                name="host"
                type="text"
                placeholder="192.168.1.100:8123"
                autoComplete="url"
                value={form.host}
                onChange={(event) => setForm((current) => ({ ...current, host: event.target.value }))}
                required
              />
              <label htmlFor="path">PATH</label>
              <input
                id="path"
                name="path"
                type="text"
                placeholder="src/definitions.txt"
                value={form.path}
                onChange={(event) => setForm((current) => ({ ...current, path: event.target.value }))}
                required={!isTest}
              />
              <label htmlFor="columns">Columns</label>
              <input
                id="columns"
                name="columns"
                type="number"
                min="1"
                step="1"
                value={form.columns}
                onChange={(event) => setForm((current) => ({ ...current, columns: event.target.value }))}
                required
              />
              {configError && <p className="error" role="alert">{configError}</p>}
              <button type="submit" className="primary-button">
                {submitting ? 'Loading...' : 'Submit'}
              </button>
            </fieldset>
          </form>
        </section>
      )}

      {screen === 'buttons' && (
        <section className="buttons-panel" aria-labelledby="buttons-title">
          <header className="toolbar">
            <h1 id="buttons-title">HaButtons</h1>
            <button type="button" className="secondary-button" onClick={openConfig}>Config</button>
          </header>
          {actionError && <p className="error" role="alert">{actionError}</p>}
          <div className="grid-scroll">
            <div className="button-grid" style={{ '--columns': validateColumns(settings.columns) }}>
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
