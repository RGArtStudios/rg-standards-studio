// Run from: cd ~/rg-standards-studio && node create-branding-final.js
const API = 'http://localhost:3010'
const LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDgwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQ4MCI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0ODAiIGZpbGw9IiMxYTFhMWEiLz4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjE1NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGE5ZTdhIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjE0NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGE5ZTdhIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8dGV4dCB4PSIyMDAiIHk9IjIzNSIgZm9udC1mYW1pbHk9Ikdlb3JnaWEsIHNlcmlmIiBmb250LXNpemU9IjExMCIgZm9udC13ZWlnaHQ9IjQwMCIgZmlsbD0iIzhhOWU3YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgbGV0dGVyLXNwYWNpbmc9Ii00Ij5SRzwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjQwMCIgZm9udC1mYW1pbHk9Ikdlb3JnaWEsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmb250LXdlaWdodD0iNDAwIiBmaWxsPSIjOGE5ZTdhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iNCI+UmFpbmllciBHYXJkZW5zPC90ZXh0Pgo8L3N2Zz4='

async function main() {
  const { token } = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@rainiergardens.io', password: 'ChangeMe123!' }),
  }).then(r => r.json())

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const { standards } = await fetch(`${API}/api/standards`, { headers }).then(r => r.json())
  const branding = standards.find(s => s.packageName === '@rg/branding')
  if (!branding) { console.error('branding standard not found'); return }

  // Delete any existing draft first
  const versions = branding.versions || []
  const draft = versions.find(v => v.status === 'DRAFT')
  if (draft) {
    console.log(`Existing draft ${draft.version} found — will skip (certify or delete it first)`)
    return
  }

  const sourceCode = `// @rg/branding — Rainier Gardens design tokens and brand assets

export const colors = {
  primary:      '#774435',
  primaryHover: '#5C3228',
  sidebar:      '#A96D53',
  surfaceAlt:   '#F9F0ED',
  border:       '#E8C5B5',
  text:         '#2C1810',
  textMuted:    '#A0705A',
  verified:     '#059669',
  tierEnhanced: '#2563EB',
  tierPriority: '#7C3AED',
  tierFeatured: '#774435',
  white:        '#FFFFFF',
  black:        '#000000',
} as const

export const typography = {
  fontSans: "'Inter', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  fontSizes: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem' },
  fontWeights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
} as const

export const spacing = {
  px: '1px', 0: '0', 1: '0.25rem', 2: '0.5rem', 3: '0.75rem',
  4: '1rem', 5: '1.25rem', 6: '1.5rem', 8: '2rem', 10: '2.5rem',
  12: '3rem', 16: '4rem', 20: '5rem', 24: '6rem',
} as const

export const radii = {
  sm: '0.375rem', md: '0.5rem', lg: '0.75rem',
  xl: '1rem', '2xl': '1.5rem', full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
} as const

export const cssVariables = \`
  --rg-primary:       \${colors.primary};
  --rg-primary-hover: \${colors.primaryHover};
  --rg-sidebar:       \${colors.sidebar};
  --rg-surface-alt:   \${colors.surfaceAlt};
  --rg-border:        \${colors.border};
  --rg-text:          \${colors.text};
  --rg-text-muted:    \${colors.textMuted};
  --rg-verified:      \${colors.verified};
  --font-sans:        \${typography.fontSans};
  --font-mono:        \${typography.fontMono};
\`

// Placeholder SVG logo — replace via brand editor once real logo PNG is available
export const logoDataUrl = '${LOGO}'
export const logoUrl     = '/rg-logo.png'
export const logoAlt     = 'Rainier Gardens LLC'
export const companyName = 'Rainier Gardens LLC'

export function BrandingShowcase() {
  const lbl = { fontSize: '10px', color: '#A0705A', fontFamily: "'Inter',system-ui,sans-serif", margin: '3px 0 0' }
  const sec = { fontSize: '11px', fontWeight: 700, color: '#A0705A', textTransform: 'uppercase', letterSpacing: '.07em', margin: '20px 0 10px', fontFamily: "'Inter',system-ui,sans-serif" }
  const COLS = [
    ['primary','#774435'],['primaryHover','#5C3228'],['sidebar','#A96D53'],
    ['surfaceAlt','#F9F0ED'],['border','#E8C5B5'],['text','#2C1810'],
    ['textMuted','#A0705A'],['verified','#059669'],['tierEnhanced','#2563EB'],['tierPriority','#7C3AED'],
  ]
  return React.createElement('div', { style: { padding: '8px', fontFamily: "'Inter',system-ui,sans-serif" } },
    React.createElement('p', { style: sec }, 'Logo (placeholder — replace via brand editor)'),
    React.createElement('img', { src: logoDataUrl, alt: 'Rainier Gardens LLC', style: { height: '80px', display: 'block', marginBottom: '4px', background: '#1a1a1a', borderRadius: '8px', padding: '8px' } }),
    React.createElement('p', { style: sec }, 'Color Palette'),
    React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px' } },
      COLS.map(([name, hex]) => React.createElement('div', { key: name, style: { textAlign: 'center' } },
        React.createElement('div', { style: { width: '48px', height: '48px', borderRadius: '8px', background: hex, border: '1px solid rgba(0,0,0,.1)' } }),
        React.createElement('p', { style: { ...lbl, maxWidth: '52px', wordBreak: 'break-word' } }, name),
        React.createElement('p', { style: { ...lbl, fontFamily: 'monospace' } }, hex),
      ))
    ),
    React.createElement('p', { style: sec }, 'Typography'),
    React.createElement('div', { style: { background: '#F9F0ED', borderRadius: '8px', padding: '14px', border: '1px solid #E8C5B5' } },
      React.createElement('p', { style: { margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#2C1810', fontFamily: "'Inter',system-ui,sans-serif" } }, 'Heading — Bold 800'),
      React.createElement('p', { style: { margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#2C1810', fontFamily: "'Inter',system-ui,sans-serif" } }, 'Subheading — Semibold 600'),
      React.createElement('p', { style: { margin: '0 0 6px', fontSize: '14px', color: '#2C1810', fontFamily: "'Inter',system-ui,sans-serif" } }, 'Body text — Regular 400'),
      React.createElement('p', { style: { margin: 0, fontSize: '12px', color: '#A0705A', fontFamily: "'Inter',system-ui,sans-serif" } }, 'Caption / muted — 12px textMuted'),
    ),
    React.createElement('p', { style: sec }, 'Spacing Scale'),
    React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' } },
      [['1','4px'],['2','8px'],['3','12px'],['4','16px'],['6','24px'],['8','32px'],['12','48px']].map(([k,v]) =>
        React.createElement('div', { key: k, style: { textAlign: 'center' } },
          React.createElement('div', { style: { width: v, height: v, background: '#774435', borderRadius: '3px', margin: '0 auto' } }),
          React.createElement('p', { style: { ...lbl, margin: '3px 0 0' } }, v),
        )
      )
    ),
    React.createElement('p', { style: { ...sec, color: '#D97706', marginTop: '20px' } }, '⚠ Action required: replace placeholder logo with real PNG via the brand editor'),
  )
}`

  const res = await fetch(`${API}/api/versions/standard/${branding.id}`, {
    method: 'POST', headers,
    body: JSON.stringify({
      sourceCode,
      visualSpec: '# @rg/branding\n\nSee BrandingShowcase for visual token reference.\n\n## Colors\n| Token | Hex |\n|-------|-----|\n| primary | #774435 |\n| surfaceAlt | #F9F0ED |\n| text | #2C1810 |\n| verified | #059669 |\n\n## Logo\nPlaceholder SVG in use. Replace with real PNG via brand editor.',
      usageExamples: "## Import\n```tsx\nimport { colors, typography } from '@rg/branding'\n```",
      testCases: '- [ ] colors.primary === #774435\n- [ ] BrandingShowcase renders\n- [ ] logoDataUrl replaced with real PNG before production',
      changelog: 'v4: Full BrandingShowcase with color swatches, typography, spacing. Placeholder SVG logo — replace with real PNG via brand editor.',
    }),
  })
  const data = await res.json()
  if (data.version) console.log(`✓ ${data.version.version} draft created`)
  else console.log(`✗ ${JSON.stringify(data)}`)
}
main().catch(console.error)
