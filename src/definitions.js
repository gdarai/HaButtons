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
