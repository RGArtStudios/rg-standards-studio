import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const STANDARDS = [
  { name: 'Branding Tokens',      packageName: '@rg/branding',     requiredBy: ['verifiedpros','rgsaasops','rgas','groundwork','flowdesk','voltdesk','airdesk'], description: 'Design tokens for colors, typography, spacing, radii, and shadows. No hardcoded hex values permitted.' },
  { name: 'UI Component Library', packageName: '@rg/ui',           requiredBy: ['verifiedpros','rgsaasops','rgas','groundwork','flowdesk','voltdesk','airdesk'], description: 'Shared React components: RgButton, RgCard, RgInput, RgModal, RgToast, RgBadge, RgSkeleton.' },
  { name: 'Security Middleware',  packageName: '@rg/security',     requiredBy: ['verifiedpros','rgsaasops','rgas'], description: 'JWT verification, RBAC, rate limiting, CSRF, and honeypot middleware.' },
  { name: 'Help Widget',          packageName: '@rg/help',         requiredBy: ['verifiedpros','rgsaasops','rgas','groundwork','flowdesk','voltdesk','airdesk'], description: 'Floating help button with context-sensitive article panel. Cmd+? shortcut.' },
  { name: 'Bug Reporter',         packageName: '@rg/bug-reporter', requiredBy: ['verifiedpros','rgsaasops','rgas','groundwork','flowdesk','voltdesk','airdesk'], description: 'Floating bug report button with severity selector and automatic console error capture.' },
  { name: 'Training Mode',        packageName: '@rg/training',     requiredBy: ['verifiedpros','rgsaasops','rgas'], description: 'Training mode overlay with guided steps and API mutation interception.' },
  { name: 'Analytics',            packageName: '@rg/analytics',    requiredBy: ['verifiedpros','rgsaasops','rgas','groundwork','flowdesk','voltdesk','airdesk'], description: 'Event tracking with PII stripping, batching, and Do Not Track support.' },
  { name: 'Bookkeeping',          packageName: '@rg/bookkeeping',  requiredBy: ['verifiedpros','rgsaasops','rgas'], description: 'Revenue event recording. RevenueSource enum covers all billing flows.' },
  { name: 'Standards Compliance', packageName: '@rg/standards',    requiredBy: ['verifiedpros','rgsaasops','rgas','groundwork','flowdesk','voltdesk','airdesk'], description: 'VADE compliance checker CLI (rg-audit). Blocks CI if standards are not met.' },
]

async function main() {
  console.log('Seeding rg-standards-studio...')

  const adminEmail = process.env.ADMIN_EMAIL    ?? 'admin@rainiergardens.io'
  const adminPass  = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!'
  const hash = await bcrypt.hash(adminPass, 12)

  const admin = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: 'Admin', passwordHash: hash, role: 'ADMIN' },
  })
  console.log(`  ✓ Admin: ${adminEmail}`)

  for (const s of STANDARDS) {
    const std = await prisma.standard.upsert({
      where:  { packageName: s.packageName },
      update: {},
      create: {
        name: s.name, packageName: s.packageName,
        description: s.description, requiredBy: s.requiredBy,
        status: 'CERTIFIED', currentVersion: 'v1',
      },
    })

    const v1exists = await prisma.standardVersion.findUnique({
      where: { standardId_version: { standardId: std.id, version: 'v1' } },
    })

    if (!v1exists) {
      await prisma.standardVersion.create({
        data: {
          standardId:    std.id,
          version:       'v1',
          sourceCode:    `// Source: rg-platform packages/${s.packageName.replace('@rg/','')}/src/index.ts`,
          visualSpec:    `# ${s.name}\n\n${s.description}\n\nSee rg-platform for full visual specification.`,
          usageExamples: `// See rg-platform packages/${s.packageName.replace('@rg/','')} README`,
          testCases:     `- [ ] Package installs without errors\n- [ ] TypeScript types export correctly\n- [ ] rg-audit passes after installation`,
          certifiedById: admin.id,
          certifiedAt:   new Date(),
          githubPrMerged: true,
        },
      })
    }
    console.log(`  ✓ ${s.name} — v1 CERTIFIED`)
  }

  console.log('\n✓ Seed complete')
  console.log(`  Login: ${adminEmail} / ${adminPass}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
