'use client'
import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'

const C = { primary: '#774435', border: '#E8C5B5', text: '#2C1810', muted: '#A0705A', surface: '#F9F0ED', success: '#059669', warning: '#D97706' }

// ── Training Step Definition ──────────────────────────────────────────────────

export interface TrainingStep {
  id:          string
  title:       string
  description: string
  target?:     string   // CSS selector to highlight
  videoUrl?:   string   // optional video/gif URL
  action?:     string   // e.g. "Click the + New Contact button"
  module:      string
}

// ── Training Flows per Module ─────────────────────────────────────────────────

const TRAINING_FLOWS: Record<string, TrainingStep[]> = {
  dashboard: [
    { id:'dash-1', module:'dashboard', title:'Welcome to RG Command', description:'RG Command is the internal operating system for Rainier Gardens LLC. This dashboard gives you a real-time view of the entire business — contacts, revenue, tickets, and staff.', },
    { id:'dash-2', module:'dashboard', title:'KPI Cards', description:'The four cards at the top show your key metrics: total active contacts, monthly recurring revenue, open support tickets, and active employees. These update in real time.', action:'Review each KPI card at the top of the dashboard.' },
    { id:'dash-3', module:'dashboard', title:'Revenue by Product', description:'The revenue breakdown shows MRR across all Rainier Gardens products — VerifiedPros, GroundWork, FlowDesk, VoltDesk, AirDesk, and RGAS. This feeds from the @rg/bookkeeping system automatically.', action:'Review the revenue breakdown chart.' },
    { id:'dash-4', module:'dashboard', title:'Activity Feed', description:'Recent tickets, communications, and pipeline deals appear here. Click any item to navigate directly to it.', action:'Review the recent activity feed.' },
  ],
  crm: [
    { id:'crm-1', module:'crm', title:'CRM Overview', description:'The CRM manages all external contacts — VerifiedPros listings, waitlist signups, incomplete applications, partners, and vendors. One contact record links to all their Rainier Gardens relationships.' },
    { id:'crm-2', module:'crm', title:'Contact Types', description:'Each contact has a type: BUSINESS, CONSUMER, PARTNER, VENDOR, or LEAD. A single business can have multiple relationships — a free VerifiedPros listing AND a paid GroundWork subscription, for example.', action:'Click Contacts in the CRM menu to see the contact list.' },
    { id:'crm-3', module:'crm', title:'Creating a Contact', description:'In training mode, creating a contact will save demo data that does not affect your real database. Try creating a test contact now.', action:'Click + New Contact and fill in the form.' },
    { id:'crm-4', module:'crm', title:'Support Tickets', description:'Tickets are linked to contacts and assigned to staff. Each ticket has a priority (LOW, NORMAL, HIGH, URGENT) and SLA tracking. URGENT tickets must receive a first response within 1 hour.', action:'Click Tickets in the CRM menu.' },
    { id:'crm-5', module:'crm', title:'Sales Pipeline', description:'The pipeline tracks prospects from LEAD through QUALIFIED, DEMO, PROPOSAL, NEGOTIATING to WON or LOST. Each deal is linked to a contact and a product vertical.', action:'Click Pipeline in the CRM menu.' },
    { id:'crm-6', module:'crm', title:'Onboarding Workflow', description:'When a new subscriber signs up in any vertical app, an onboarding record is created automatically here. The onboarding specialist guides the customer through ACCOUNT_CREATED → PROFILE_COMPLETE → FIRST_FEATURE_USED → ONBOARDING_COMPLETE.', action:'Click Onboarding in the CRM menu.' },
    { id:'crm-7', module:'crm', title:'Health Scoring', description:'Each active subscriber receives a health score (0–100) computed nightly. HEALTHY (80–100), AT_RISK (50–79), CRITICAL (0–49). CRITICAL contacts surface automatically on the dashboard for immediate attention.' },
    { id:'crm-8', module:'crm', title:'Bulk Outreach', description:'Send targeted email campaigns to segments of your contacts. Filter by type, product, tier, health score, or geography. All campaigns are CAN-SPAM compliant with automatic unsubscribe handling.', action:'Click Outreach in the CRM menu.' },
  ],
  finance: [
    { id:'fin-1', module:'finance', title:'Finance Overview', description:'The Finance module manages bookkeeping, payroll, and revenue reporting. Revenue flows automatically from all vertical apps via the @rg/bookkeeping standard — no manual entry required for subscription revenue.' },
    { id:'fin-2', module:'finance', title:'Bookkeeping', description:'Full double-entry bookkeeping: Chart of Accounts, General Ledger, Accounts Receivable, Accounts Payable, Invoicing, Bank Feed (Plaid), and Reconciliation. PRO tier adds payment reminders, progress invoicing, and credit memos.', action:'Click Bookkeeping in the Finance menu.' },
    { id:'fin-3', module:'finance', title:'Revenue Dashboard', description:'MRR by product, new MRR, churned MRR, and net MRR change month-over-month. All subscription revenue is tagged by RevenueSource and product vertical automatically.', action:'Click Revenue in the Finance menu.' },
    { id:'fin-4', module:'finance', title:'Payroll', description:'Payroll processes salary and hourly staff. It reads compensation from HR and approved hours from Time & Attendance. Neither writes back to HR except for PTO balance updates.', action:'Click Payroll in the Finance menu.' },
  ],
  hr: [
    { id:'hr-1', module:'hr', title:'HR Overview', description:'HR is the source of truth for all employee data. Time & Attendance and Payroll both read from HR — they never write back to the employee record (except PTO balances). All employee lifecycle events start in HR.' },
    { id:'hr-2', module:'hr', title:'Employee Records', description:'Each employee has a unique ID (e.g. RG-0042), department, role assignments, and manager relationship. Terminating an employee here immediately revokes clock-in access and triggers the final paycheck.', action:'Click Employees in the HR menu.' },
    { id:'hr-3', module:'hr', title:'Time & Attendance', description:'Employees clock in/out via mobile PWA or web kiosk. GPS location is recorded. Approved hours flow automatically to the next payroll run.', action:'Click Time & Attendance in the HR menu.' },
    { id:'hr-4', module:'hr', title:'Onboarding New Staff', description:'When a new employee is created and their onboarding checklist is complete, they are automatically enrolled in the active T&A schedule and the next scheduled pay run.', action:'Try creating a demo employee record.' },
  ],
  marketing: [
    { id:'mkt-1', module:'marketing', title:'Marketing Overview', description:'The Marketing module manages campaigns, brand assets, advertising spend, and content calendar across all Rainier Gardens products.' },
    { id:'mkt-2', module:'marketing', title:'Brand Assets', description:'All approved logos, color tokens, and copy are stored here and linked to the certified @rg/branding standard. Any update to the brand standard automatically flags stale assets for review.', action:'Click Brand in the Marketing menu.' },
    { id:'mkt-3', module:'marketing', title:'Campaigns', description:'Create email campaigns targeted to specific contact segments. Campaigns created here can also be sent via the CRM Outreach module.', action:'Click Campaigns in the Marketing menu.' },
    { id:'mkt-4', module:'marketing', title:'Advertising Tracking', description:'Track spend, impressions, clicks, and conversions per product vertical and advertising channel. Connect to Google Ads and Meta via the Settings integrations.' },
  ],
  admin: [
    { id:'adm-1', module:'admin', title:'Administration Overview', description:'The Admin module manages company assets, facilities, legal documents, licenses, and insurance. Expiry alerts are generated automatically 90, 60, and 30 days before any renewal is due.' },
    { id:'adm-2', module:'admin', title:'Asset Inventory', description:'Track vehicles, equipment, and other company assets — purchase date, assigned staff, depreciation schedule, and current value.', action:'Click Assets in the Admin menu.' },
    { id:'adm-3', module:'admin', title:'Legal & Licenses', description:'Store contracts, NDAs, business licenses, and insurance policies. The system alerts the relevant staff before any document expires.', action:'Click Legal in the Admin menu.' },
    { id:'adm-4', module:'admin', title:'Facilities', description:'Manage office locations, lease terms, utility accounts, and maintenance logs.', action:'Click Facilities in the Admin menu.' },
  ],
  standards: [
    { id:'std-1', module:'standards', title:'Standards Studio Overview', description:'The Standards Studio is where all @rg/* platform standards are defined, reviewed, and certified. Every Rainier Gardens app must adopt all certified standards before it can deploy.' },
    { id:'std-2', module:'standards', title:'Certifying a Standard', description:'A standard moves from DRAFT to CERTIFIED when a Certifier reviews the source code, visual spec, and test cases and clicks Certify. Certification opens a GitHub PR against rg-platform automatically.' },
    { id:'std-3', module:'standards', title:'The Compliance Dashboard', description:'The compliance dashboard shows which apps have adopted each certified standard. Any app that falls behind is blocked from deploying by rg-audit in CI.', action:'Click Compliance in the Standards menu.' },
    { id:'std-4', module:'standards', title:'AI Assistant', description:'The ✦ Claude Assistant is available on every standard page. Ask it to generate source code, review a standard, explain what it does, validate source against spec, or write test cases.', action:'Open any standard and click the ✦ button.' },
  ],
}

const ALL_STEPS = Object.values(TRAINING_FLOWS).flat()

// ── Context ───────────────────────────────────────────────────────────────────

interface TrainingCtx {
  active:      boolean
  demoMode:    boolean
  currentStep: TrainingStep | null
  stepIndex:   number
  totalSteps:  number
  module:      string
  start:       (module?: string) => void
  stop:        () => void
  next:        () => void
  prev:        () => void
  setModule:   (module: string) => void
  interceptMutation: (fn: () => Promise<any>) => Promise<any>
}

const Ctx = createContext<TrainingCtx>({
  active: false, demoMode: false, currentStep: null,
  stepIndex: 0, totalSteps: 0, module: 'dashboard',
  start: () => {}, stop: () => {}, next: () => {}, prev: () => {},
  setModule: () => {}, interceptMutation: async (fn) => fn(),
})

export const useTraining = () => useContext(Ctx)

// ── Provider ──────────────────────────────────────────────────────────────────

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [active,     setActive]     = useState(false)
  const [demoMode,   setDemoMode]   = useState(true)
  const [module,     setModuleState]= useState('dashboard')
  const [stepIndex,  setStepIndex]  = useState(0)

  const steps      = TRAINING_FLOWS[module] ?? TRAINING_FLOWS.dashboard
  const currentStep = steps[stepIndex] ?? null
  const totalSteps  = steps.length

  const start = useCallback((mod?: string) => {
    setModuleState(mod ?? 'dashboard')
    setStepIndex(0)
    setActive(true)
    setDemoMode(true)
  }, [])

  const stop  = useCallback(() => { setActive(false); setDemoMode(false) }, [])
  const next  = useCallback(() => setStepIndex(i => Math.min(i + 1, steps.length - 1)), [steps.length])
  const prev  = useCallback(() => setStepIndex(i => Math.max(i - 1, 0)), [])

  const setModule = useCallback((mod: string) => {
    setModuleState(mod)
    setStepIndex(0)
  }, [])

  const interceptMutation = useCallback(async (fn: () => Promise<any>) => {
    if (demoMode && active) {
      await new Promise(r => setTimeout(r, 400))
      return { demo: true, message: 'Training mode — no real data was saved.' }
    }
    return fn()
  }, [demoMode, active])

  return (
    <Ctx.Provider value={{ active, demoMode, currentStep, stepIndex, totalSteps, module, start, stop, next, prev, setModule, interceptMutation }}>
      {children}
      {active && <TrainingBanner />}
      {active && currentStep && <TrainingStepCard step={currentStep} index={stepIndex} total={totalSteps} onNext={next} onPrev={prev} onStop={stop} />}
    </Ctx.Provider>
  )
}

// ── Training Banner ───────────────────────────────────────────────────────────

function TrainingBanner() {
  const { stop, module, setModule, demoMode } = useTraining()
  const modules = Object.keys(TRAINING_FLOWS)

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:2000, background:'#D97706', color:'white', padding:'8px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:"'Inter',system-ui,sans-serif", boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <span style={{ fontSize:'16px' }}>🎓</span>
        <span style={{ fontWeight:700, fontSize:'13px' }}>Training Mode Active</span>
        {demoMode && <span style={{ fontSize:'11px', background:'rgba(0,0,0,.2)', padding:'2px 8px', borderRadius:'99px' }}>Demo data — nothing real will be saved</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontSize:'12px', opacity:0.8 }}>Module:</span>
        <select value={module} onChange={e => setModule(e.target.value)}
          style={{ background:'rgba(0,0,0,.2)', color:'white', border:'1px solid rgba(255,255,255,.4)', borderRadius:'5px', padding:'3px 8px', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>
          {modules.map(m => <option key={m} value={m} style={{ background:'#D97706' }}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
        </select>
        <button onClick={stop}
          style={{ background:'rgba(0,0,0,.25)', border:'1px solid rgba(255,255,255,.4)', borderRadius:'6px', color:'white', padding:'4px 12px', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          Exit Training
        </button>
      </div>
    </div>
  )
}

// ── Training Step Card ────────────────────────────────────────────────────────

function TrainingStepCard({ step, index, total, onNext, onPrev, onStop }: {
  step: TrainingStep; index: number; total: number
  onNext: () => void; onPrev: () => void; onStop: () => void
}) {
  const isLast = index === total - 1

  return (
    <div style={{ position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)', width:'480px', background:'white', border:`1px solid ${C.border}`, borderRadius:'14px', boxShadow:'0 8px 32px rgba(119,68,53,.2)', zIndex:1999, fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden' }}>

      {/* Progress bar */}
      <div style={{ height:'3px', background:'#F9F0ED' }}>
        <div style={{ height:'100%', background:C.primary, width:`${((index+1)/total)*100}%`, transition:'width .3s ease' }} />
      </div>

      {/* Header */}
      <div style={{ padding:'14px 16px 10px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'14px' }}>🎓</span>
          <span style={{ fontWeight:700, fontSize:'14px', color:C.text }}>{step.title}</span>
        </div>
        <span style={{ fontSize:'11px', color:C.muted }}>Step {index+1} of {total}</span>
      </div>

      {/* Content */}
      <div style={{ padding:'14px 16px' }}>
        <p style={{ margin:'0 0 10px', fontSize:'13px', color:C.text, lineHeight:1.6 }}>{step.description}</p>

        {step.action && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'10px 12px', marginBottom:'10px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
            <span style={{ fontSize:'14px', flexShrink:0 }}>👉</span>
            <p style={{ margin:0, fontSize:'12px', color:C.primary, fontWeight:600, lineHeight:1.5 }}>{step.action}</p>
          </div>
        )}

        {step.videoUrl && (
          <video src={step.videoUrl} autoPlay loop muted playsInline
            style={{ width:'100%', borderRadius:'8px', border:`1px solid ${C.border}`, marginBottom:'10px' }} />
        )}
      </div>

      {/* Navigation */}
      <div style={{ padding:'10px 16px', borderTop:`1px solid ${C.border}`, background:C.surface, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={onPrev} disabled={index===0}
          style={{ padding:'7px 16px', background:'white', color:C.primary, border:`1.5px solid ${C.primary}`, borderRadius:'7px', fontSize:'12px', fontWeight:600, cursor:index===0?'not-allowed':'pointer', opacity:index===0?0.4:1, fontFamily:'inherit' }}>
          ← Previous
        </button>
        <button onClick={onStop}
          style={{ background:'none', border:'none', color:C.muted, fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>
          Skip tour
        </button>
        {isLast ? (
          <button onClick={onStop}
            style={{ padding:'7px 16px', background:C.success, color:'white', border:'none', borderRadius:'7px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Finish ✓
          </button>
        ) : (
          <button onClick={onNext}
            style={{ padding:'7px 16px', background:C.primary, color:'white', border:'none', borderRadius:'7px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Training Mode Trigger Button ──────────────────────────────────────────────
// Add this to Settings or as a floating button

export function TrainingModeButton({ module }: { module?: string }) {
  const { start, active } = useTraining()
  if (active) return null
  return (
    <button onClick={() => start(module)}
      style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'8px 14px', background:C.surface, color:C.primary, border:`1.5px solid ${C.primary}`, borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:"'Inter',system-ui,sans-serif" }}>
      🎓 Start Training
    </button>
  )
}
