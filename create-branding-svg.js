const API = 'http://localhost:3010'

const SVG_LOGO = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480"><rect width="400" height="480" fill="#1a1a1a"/><circle cx="200" cy="200" r="155" fill="none" stroke="#8a9e7a" stroke-width="2"/><circle cx="200" cy="200" r="145" fill="none" stroke="#8a9e7a" stroke-width="1"/><text x="200" y="235" font-family="Georgia,serif" font-size="110" fill="#8a9e7a" text-anchor="middle">RG</text><text x="200" y="400" font-family="Georgia,serif" font-size="36" fill="#8a9e7a" text-anchor="middle" letter-spacing="4">Rainier Gardens</text></svg>`).toString('base64')}`

const SOURCE = `// @rg/branding — Rainier Gardens design tokens and brand assets

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

export const logoDataUrl = '${SVG_LOGO}'
export const logoUrl     = '/rg-logo.svg'
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
    React.createElement('img', { src: '${SVG_LOGO}', alt: 'Rainier Gardens LLC', style: { height: '80px', display: 'block', marginBottom: '4px' } }),
    React.createElement('p', { style: lbl }, 'Rainier Gardens LLC — SVG logo (dark bg, sage green)'),
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
`

async function main() {
  const { token } = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@rainiergardens.io', password: 'ChangeMe123!' }),
  }).then(r => r.json())

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // Create the standard fresh (it was deleted)
  const createRes = await fetch(`${API}/api/standards`, {
    method: 'POST', headers,
    body: JSON.stringify({
      name: 'Branding Tokens',
      packageName: '@rg/branding',
      description: 'Design tokens, color palette, typography, spacing, radii, shadows, CSS variables, logo assets, and BrandingShowcase component for all Rainier Gardens applications.',
      requiredBy: ['verifiedpros', 'rgsaasops', 'rgas', 'groundwork', 'flowdesk', 'voltdesk', 'airdesk', 'vade'],
      sourceCode: SOURCE,
      visualSpec: `# @rg/branding — Visual Spec\n\n## Colors\n| Token | Hex | Usage |\n|-------|-----|-------|\n| primary | #774435 | Buttons, links, active states |\n| primaryHover | #5C3228 | Hover state |\n| sidebar | #A96D53 | Sidebar background |\n| surfaceAlt | #F9F0ED | Page and card backgrounds |\n| border | #E8C5B5 | All borders and dividers |\n| text | #2C1810 | Primary body text |\n| textMuted | #A0705A | Secondary text, captions |\n| verified | #059669 | Verified badges, success states |\n\n## Logo\n- SVG with dark background (#1a1a1a) and sage green (#8a9e7a) RG monogram\n- Use logoDataUrl for sandboxed previews and emails\n- Use logoUrl for standard web rendering\n- Minimum height: 32px\n\n## Typography\n- Font: Inter (Google Fonts)\n- Fallback: system-ui, -apple-system, sans-serif\n- Monospace: JetBrains Mono\n\n## Rule\nNo app may hardcode hex values. All colors must use tokens from @rg/branding.`,
      usageExamples: "## Import tokens\n\n\`\`\`tsx\nimport { colors, typography, radii } from '@rg/branding'\n\n<div style={{ background: colors.surfaceAlt, borderRadius: radii.lg }}>\n  <p style={{ color: colors.text }}>Hello</p>\n</div>\n\`\`\`\n\n## Logo\n\n\`\`\`tsx\nimport { logoUrl, logoDataUrl, logoAlt } from '@rg/branding'\n\n// Standard web\n<img src={logoUrl} alt={logoAlt} style={{ height: '40px' }} />\n\n// Sandboxed preview or email\n<img src={logoDataUrl} alt={logoAlt} style={{ height: '40px' }} />\n\`\`\`",
      testCases: '- [ ] colors.primary returns #774435\n- [ ] logoDataUrl is a valid base64 SVG data URL\n- [ ] BrandingShowcase renders without errors\n- [ ] No hardcoded hex values in any app source\n- [ ] cssVariables contains all --rg-* properties\n- [ ] rg-audit passes after installation',
    }),
  })
  const data = await createRes.json()
  if (data.standard) {
    console.log(`✓ @rg/branding recreated with SVG logo — v1 draft`)
    console.log(`  Standard ID: ${data.standard.id}`)
  } else {
    console.log(`✗ ${data.error}`)
  }
}

main().catch(console.error)
