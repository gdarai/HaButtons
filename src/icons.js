import { createElement } from 'react'

const icons = {
  'tick-v yes': [
    ['path', { d: 'M4 12l5 5L20 6' }],
  ],
  'tick-x no': [
    ['path', { d: 'M5 5l14 14M19 5L5 19' }],
  ],
  'lit bulb': [
    ['path', { d: 'M9 18h6m-5 3h4m-5-6c0-2-3-3-3-7a6 6 0 0 1 12 0c0 4-3 5-3 7v1H9zM12 1v1M3 8H2m20 0h-1M4.5 2.5l1 1m13-1-1 1' }],
  ],
  'unlit bulb': [
    ['path', { d: 'M9 18h6m-5 3h4m-5-6c0-2-3-3-3-7a6 6 0 0 1 12 0c0 4-3 5-3 7v1H9z' }],
  ],
  'arrow up': [
    ['path', { d: 'M12 20V4m-7 7 7-7 7 7' }],
  ],
  'arrow down': [
    ['path', { d: 'M12 4v16m-7-7 7 7 7-7' }],
  ],
  sun: [
    ['circle', { cx: 12, cy: 12, r: 4 }],
    ['path', { d: 'M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42' }],
  ],
  moon: [
    ['path', { d: 'M20.5 15.5A9 9 0 0 1 8.5 3.5a9 9 0 1 0 12 12z' }],
  ],
  'half moon': [
    ['path', { d: 'M12 2a10 10 0 1 0 0 20 7 7 0 0 0 0-20z' }],
    ['path', { d: 'M12 2v20' }],
  ],
  door: [
    ['path', { d: 'M5 22V2h14v20H5zm4 0V5l7-1v18M13 13h1' }],
  ],
  'sound volume plus': [
    ['path', { d: 'M4 9H8l5-4v14l-5-4H4zM17 9v6m-3-3h6' }],
  ],
  'sound volume minus': [
    ['path', { d: 'M4 9H8l5-4v14l-5-4H4zM16 12h6' }],
  ],
  play: [
    ['path', { d: 'M7 4v16l13-8z' }],
  ],
  pause: [
    ['rect', { x: 5, y: 4, width: 5, height: 16, rx: 1 }],
    ['rect', { x: 14, y: 4, width: 5, height: 16, rx: 1 }],
  ],
  'question mark': [
    ['path', { d: 'M9 9a3 3 0 1 1 5 2.3c-1.3 1-2 1.5-2 3.2M12 19h.01' }],
    ['circle', { cx: 12, cy: 12, r: 10 }],
  ],
  'exclamation mark': [
    ['path', { d: 'M12 6v8m0 4h.01' }],
    ['circle', { cx: 12, cy: 12, r: 10 }],
  ],
  circle: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
  ],
  'circle full': [
    ['circle', { cx: 12, cy: 12, r: 9, fill: 'currentColor' }],
  ],
  square: [
    ['rect', { x: 3, y: 3, width: 18, height: 18 }],
  ],
  'square full': [
    ['rect', { x: 3, y: 3, width: 18, height: 18, fill: 'currentColor' }],
  ],
  triangle: [
    ['path', { d: 'M12 3l9 18H3z' }],
  ],
  'triangle full': [
    ['path', { d: 'M12 3l9 18H3z', fill: 'currentColor' }],
  ],
  'square 1/4 full': [
    ['rect', { x: 3, y: 3, width: 18, height: 18 }],
    ['rect', { x: 3, y: 16.5, width: 18, height: 4.5, fill: 'currentColor', stroke: 'none' }],
  ],
  'square 1/2 full': [
    ['rect', { x: 3, y: 3, width: 18, height: 18 }],
    ['rect', { x: 3, y: 12, width: 18, height: 9, fill: 'currentColor', stroke: 'none' }],
  ],
  'square 3/4 full': [
    ['rect', { x: 3, y: 3, width: 18, height: 18 }],
    ['rect', { x: 3, y: 7.5, width: 18, height: 13.5, fill: 'currentColor', stroke: 'none' }],
  ],
}

export function Icon({ name }) {
  const shapes = icons[name] ?? icons['question mark']
  return createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: 48,
      height: 48,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      focusable: false,
    },
    ...shapes.map(([tag, props], index) => createElement(tag, { ...props, key: index })),
  )
}
