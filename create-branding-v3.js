const fs   = require('fs')
const path = require('path')
const API  = 'http://localhost:3010'

const LOGO_PATHS = [
  path.join(process.env.HOME, 'rg-verifiedpros/apps/web/public/logo.png'),
  path.join(process.env.HOME, 'rg-verifiedpros/apps/web/public/rg-logo.png'),
  path.join(process.env.HOME, 'Downloads/Logos-103.png'),
]

let logoDataUrl = null
for (const p of LOGO_PATHS) {
  if (fs.existsSync(p)) {
    const b64 = fs.readFileSync(p).toString('base64')
    logoDataUrl = `data:image/png;base64,${b64}`
    console.log(`Logo loaded from: ${p}`)
    break
  }
}
if (!logoDataUrl) { console.error('Logo not found. Place rg-logo.png in ~/Downloads and retry.'); process.exit(1) }

const SOURCE = `
// @rg/branding — Rainier Gardens design tokens and brand assets

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
  fontSizes: {
    xs: '0.75rem', sm: '0.875rem', base: '1rem',
    lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem',
  },
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

export const cssVariables = \\\`
  --rg-primary:       \\\${colors.primary};
  --rg-primary-hover: \\\${colors.primaryHover};
  --rg-sidebar:       \\\${colors.sidebar};
  --rg-surface-alt:   \\\${colors.surfaceAlt};
  --rg-border:        \\\${colors.border};
  --rg-text:          \\\${colors.text};
  --rg-text-muted:    \\\${colors.textMuted};
  --rg-verified:      \\\${colors.verified};
  --font-sans:        \\\${typography.fontSans};
  --font-mono:        \\\${typography.fontMono};
\\\`

export const logoDataUrl = '__LOGO__'
export const logoUrl     = '/rg-logo.png'
export const logoAlt     = 'Rainier Gardens LLC'
export const companyName = 'Rainier Gardens LLC'

export function BrandingShowcase() {
  const lbl = { fontSize: '10px', color: '#A0705A', fontFamily: "'Inter',system-ui,sans-serif", margin: '3px 0 0' }
  const sec = { fontSize: '11px', fontWeight: 700, color: '#A0705A', textTransform: 'uppercase', letterSpacing: '.07em', margin: '20px 0 10px', fontFamily: "'Inter',system-ui,sans-serif" }
  const COLS = [
    ['primary','#774435'],['primaryHover','#5C3228'],['sidebar','#A96D53'],
    ['surfaceAlt','#F9F0ED'],['border','#E8C5B5'],['text','#2C1810'],
    ['textMuted','#A0705A'],['verified','#059669'],
    ['tierEnhanced','#2563EB'],['tierPriority','#7C3AED'],
  ]
  return React.createElement('div', { style: { padding: '8px', fontFamily: "'Inter',system-ui,sans-serif" } },
    React.createElement('p', { style: sec }, 'Logo'),
    React.createElement('img', { src: '__LOGO__', alt: 'Rainier Gardens LLC', style: { height: '60px', display: 'block', marginBottom: '4px' } }),
    React.createElement('p', { style: lbl }, 'Rainier Gardens LLC — primary logo'),
    React.createElement('p', { style: sec }, 'Color Palette'),
    React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px' } },
      COLS.map(([name, hex]) => React.createElement('div', { key: name, style: { textAlign: 'center' } },
        React.createElement('div', { style: { width: '48px', height: '48px', borderRadius: '8px', background: hex, border: '1px solid rgba(0,0,0,.1)' } }),
        React.createElement('p', { style: { ...lbl, maxWidth: '48px' } }, name),
        React.createElement('p', { style: { ...lbl, fontFamily: 'monospace' } }, hex),
      ))
    ),
    React.createElement('p', { style: sec }, 'Typography'),
    React.createElement('div', { style: { background: '#F9F0ED', borderRadius: '8px', padding: '14px' } },
      React.createElement('p', { style: { margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#2C1810', fontFamily: "'Inter',system-ui,sans-serif" } }, 'Heading — Bold 800'),
      React.createElement('p', { style: { margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#2C1810', fontFamily: "'Inter',system-ui,sans-serif" } }, 'Subheading — Semibold 600'),
      React.createElement('p', { style: { margin: '0 0 6px', fontSize: '14px', fontWeight: 400, color: '#2C1810', fontFamily: "'Inter',system-ui,sans-serif" } }, 'Body text — Regular 400'),
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
  )
}
`.replace(/__LOGO__/g, logoDataUrl)

async function main() {
  const { token } = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@rainiergardens.io', password: 'ChangeMe123!' }),
  }).then(r => r.json())

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const { standards } = await fetch(`${API}/api/standards`, { headers }).then(r => r.json())
  const branding = standards.find(s => s.packageName === '@rg/branding')
  console.log(`Found: ${branding.name}`)

  const res = await fetch(`${API}/api/versions/standard/${branding.id}`, {
    method: 'POST', headers,
    body: JSON.stringify({
      sourceCode: SOURCE,
      visualSpec: `# @rg/branding — Visual Spec\n\n## Colors\n| Token | Hex | Usage |\n|-------|-----|-------|\n| primary | #774435 | Buttons, links, active states |\n| primaryHover | #5C3228 | Hover state |\n| sidebar | #A96D53 | Sidebar background |\n| surfaceAlt | #F9F0ED | Page and card backgrounds |\n| border | #E8C5B5 | All borders and dividers |\n| text | #2C1810 | Primary body text |\n| textMuted | #A0705A | Secondary text, captions |\n| verified | #059669 | Verified badges, success states |\n\n## Logo\n- Use logoDataUrl for sandboxed previews and emails\n- Use logoUrl for standard web rendering\n- Minimum height: 32px\n\n## Typography\n- Font: Inter (Google Fonts)\n- Fallback: system-ui, -apple-system, sans-serif\n- Monospace: JetBrains Mono\n\n## Rule\nNo app may hardcode hex values. All colors must use tokens from @rg/branding.`,
      usageExamples: "## Import tokens\n\n```tsx\nimport { colors, typography, radii } from '@rg/branding'\n\n<div style={{ background: colors.surfaceAlt, borderRadius: radii.lg }}>\n  <p style={{ color: colors.text }}>Hello</p>\n</div>\n```\n\n## Logo\n\n```tsx\nimport { logoUrl, logoDataUrl, logoAlt } from '@rg/branding'\n\n// Standard web\n<img src={logoUrl} alt={logoAlt} style={{ height: '40px' }} />\n\n// Sandboxed preview or email\n<img src={logoDataUrl} alt={logoAlt} style={{ height: '40px' }} />\n```",
      testCases: '- [ ] colors.primary returns #774435\n- [ ] logoDataUrl is a valid base64 data URL\n- [ ] BrandingShowcase renders without errors\n- [ ] No hardcoded hex values in any app source\n- [ ] cssVariables contains all --rg-* properties\n- [ ] rg-audit passes after installation',
      changelog: 'v3: Added BrandingShowcase with live color swatches, typography samples, spacing scale, and embedded logo. Added logoDataUrl for sandbox/email rendering.',
    }),
  })
  const data = await res.json()
  if (data.version) console.log(`✓ ${data.version.version} draft created`)
  else console.log(`✗ ${data.error}`)
}

main().catch(console.error)
