export const STORAGE_KEYS = {
  host: 'habuttons.url',
  path: 'habuttons.path',
  columns: 'habuttons.columns',
}

export function readSettings() {
  return {
    host: localStorage.getItem(STORAGE_KEYS.host) ?? '',
    path: localStorage.getItem(STORAGE_KEYS.path) ?? '',
    columns: localStorage.getItem(STORAGE_KEYS.columns) ?? '2',
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.host, settings.host)
  localStorage.setItem(STORAGE_KEYS.path, settings.path)
  localStorage.setItem(STORAGE_KEYS.columns, settings.columns)
}

export function validateColumns(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error('Columns must be a positive whole number.')
  }
  return Number(value)
}

export function baseUrl(host) {
  const value = host.trim()
  if (!value) {
    throw new Error('Enter a URL (IP:PORT) in Config.')
  }
  if (!/^[a-zA-Z0-9.[\]:-]+$/.test(value)) {
    throw new Error('URL must contain only a host and optional port, without a scheme or path.')
  }
  const url = new URL(`http://${value}/`)
  if (!url.hostname || url.username || url.password || url.pathname !== '/') {
    throw new Error('URL must contain only a host and optional port.')
  }
  return url
}

export function definitionsUrl(host, path) {
  const base = baseUrl(host)
  const filePath = path.trim().replace(/^\/+/, '')
  if (!filePath || /[?#\\]/.test(filePath)) {
    throw new Error('Enter a PATH to a text file, without backslashes, a query, or a fragment.')
  }
  return new URL(`/${filePath}`, base).href
}

export function webhookUrl(host, command) {
  return new URL(`api/webhook/${encodeURIComponent(command)}`, baseUrl(host)).href
}

export function parseDefinitions(text) {
  const buttons = []
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line) continue
    const fields = line.split('|').map((field) => field.trim())
    if (fields.length !== 4 || fields.some((field) => !field)) {
      throw new Error(`Invalid button definition on line ${index + 1}: expected name|icon|color|command.`)
    }
    const [name, icon, color, command] = fields
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new Error(`Invalid color on line ${index + 1}: use #RRGGBB.`)
    }
    buttons.push({ name, icon, color, command })
  }
  if (!buttons.length) {
    throw new Error('The definitions file contains no buttons.')
  }
  return buttons
}

export function iconColor(background) {
  const channels = [1, 3, 5].map((start) => {
    const channel = parseInt(background.slice(start, start + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return luminance > 0.179 ? '#000000' : '#ffffff'
}
