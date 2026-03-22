# rg-standards-studio

Rainier Gardens Standards Definition and Certification Studio.

Governance layer for `rg-platform`. Every `@rg/*` package starts here as a Draft,
goes through a refinement cycle, and when certified automatically opens a PR against rg-platform.

## Roles

| Role | Permissions |
|------|-------------|
| Proposer | Create drafts, submit change proposals |
| Certifier | Everything above + certify drafts, resolve proposals |
| Admin | Everything above + deprecate standards, manage users, audit log |

## Refinement cycle
```
Draft created → live preview + proposals → Certifier approves
→ Studio opens PR against rg-platform → developer merges
→ rg-audit CLI enforces certified version in every app's CI
```

## Running locally
```bash
createdb rg_standards_studio
cp .env.template apps/api/.env.local   # fill in values
cp .env.template apps/web/.env.local   # set NEXT_PUBLIC_API_URL only
npm install
cd apps/api && npx prisma migrate dev && npx prisma db seed
npm run dev:api   # http://localhost:3010
npm run dev:web   # http://localhost:3011
```

Default login after seed: `admin@rainiergardens.io` / `ChangeMe123!`
**Change the admin password immediately.**
