const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  console.log('Launching browser to generate PDF...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tiny Mind Play School — Complete Project Documentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
      font-size: 13.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Cover / Hero Header */
    .hero-header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
      color: white;
      padding: 32px 28px;
      border-radius: 14px;
      margin-bottom: 26px;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.25);
    }

    .hero-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .hero-title {
      font-size: 26px;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .hero-subtitle {
      font-size: 13px;
      opacity: 0.92;
      max-width: 90%;
      line-height: 1.5;
    }

    .meta-row {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.25);
      font-size: 11.5px;
      opacity: 0.95;
    }

    /* Headings */
    h2 {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      page-break-after: avoid;
    }

    h2 .num {
      background: #4f46e5;
      color: white;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    h3 {
      font-size: 14.5px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 16px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 10px;
      color: #334155;
    }

    /* Cards & Grids */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      page-break-inside: avoid;
    }

    .card-title {
      font-weight: 700;
      font-size: 13px;
      color: #1e1b4b;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card p {
      font-size: 12px;
      color: #475569;
      margin-bottom: 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px 0;
      font-size: 12px;
      page-break-inside: avoid;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Code & Tree */
    pre, code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    }

    code {
      background: #eef2ff;
      color: #4338ca;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 500;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 11px;
      line-height: 1.45;
      overflow-x: auto;
      margin: 10px 0 16px 0;
      page-break-inside: avoid;
    }

    /* Badges */
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-amber { background: #fef3c7; color: #b45309; }

    /* Highlights / Callouts */
    .callout {
      border-left: 4px solid #6366f1;
      background: #f5f3ff;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin: 12px 0;
      font-size: 12.5px;
      color: #3730a3;
      page-break-inside: avoid;
    }

    .page-break {
      page-break-before: always;
    }

    /* Lists */
    ul {
      margin-left: 18px;
      margin-bottom: 12px;
    }

    li {
      margin-bottom: 4px;
      color: #334155;
    }

    li strong {
      color: #0f172a;
    }
  </style>
</head>
<body>

  <!-- COVER HEADER -->
  <div class="hero-header">
    <div class="hero-badge">System Documentation & Technical Reference</div>
    <div class="hero-title">Tiny Mind Play School</div>
    <div class="hero-subtitle">
      A full-stack, enterprise-grade Next.js 16 preschool marketing platform and dual-portal management system with Supabase backend, RLS security, and real-time communication.
    </div>
    <div class="meta-row">
      <div><strong>Version:</strong> 0.1.0 (Production Ready)</div>
      <div><strong>Target Node:</strong> v22+</div>
      <div><strong>Framework:</strong> Next.js 16.2 (App Router)</div>
      <div><strong>Database:</strong> PostgreSQL / Supabase</div>
    </div>
  </div>

  <!-- SECTION 1 -->
  <h2><span class="num">1</span> System Architecture & Core Philosophy</h2>
  <p>
    The platform is architected around a <strong>hybrid portal model</strong> catering to public visitors, school administrative staff, and student guardians with high performance, strict data isolation, and responsive UI.
  </p>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">🌐 Public Engagement Layer</div>
      <p>Interactive web presence showcasing programs, philosophy, admissions, interactive 3D Dome Gallery, FAQs, and parent resources.</p>
    </div>
    <div class="card">
      <div class="card-title">🛡️ Admin Command Center</div>
      <p>Complete control over student lifecycles, fee billing, automated receipt generation, daily attendance, notifications, and analytics.</p>
    </div>
    <div class="card">
      <div class="card-title">👨‍👩‍👧 Parent Self-Service Portal</div>
      <p>Personalized dashboards for parents with real-time attendance logs, fee payment history, progress notes, and direct two-way messaging.</p>
    </div>
    <div class="card">
      <div class="card-title">⚡ Dual Authentication Engine</div>
      <p>Decoupled auth: Supabase Auth for staff + Edge-compatible JWT cookies for student admission-number logins.</p>
    </div>
  </div>

  <!-- SECTION 2 -->
  <h2><span class="num">2</span> Complete Technology Stack</h2>
  <table>
    <thead>
      <tr>
        <th>Layer</th>
        <th>Technologies</th>
        <th>Key Role & Implementation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend Core</strong></td>
        <td>Next.js 16.2.6 (App Router), React 19, TypeScript</td>
        <td>Server and client components with strict typing across routes, UI, and stores</td>
      </tr>
      <tr>
        <td><strong>Styling & Design</strong></td>
        <td>Tailwind CSS 3.4, PostCSS, Radix UI Primitives</td>
        <td>Custom design tokens, responsive cards, modals, and accessible dropdowns</td>
      </tr>
      <tr>
        <td><strong>Motion & 3D</strong></td>
        <td>Framer Motion 12.4, @use-gesture/react</td>
        <td>Scroll reveals, micro-animations, and interactive 3D Dome Gallery with inertia physics</td>
      </tr>
      <tr>
        <td><strong>Database & Security</strong></td>
        <td>Supabase PostgreSQL + Row-Level Security (RLS)</td>
        <td>Granular row-level permissions guaranteeing parents access strictly their child's records</td>
      </tr>
      <tr>
        <td><strong>Authentication</strong></td>
        <td>Supabase Auth + <code>jose</code> JWT + <code>bcryptjs</code></td>
        <td>Dual auth: Staff email/OAuth & Parent Admission ID with signed HTTP-only cookies</td>
      </tr>
      <tr>
        <td><strong>Data Interchange</strong></td>
        <td><code>xlsx</code> (SheetJS), <code>papaparse</code></td>
        <td>Bulk student import/export and financial receipt generation</td>
      </tr>
      <tr>
        <td><strong>Testing & QA</strong></td>
        <td>Jest, React Testing Library, Playwright</td>
        <td>Unit tests, component tests, and end-to-end multi-role browser test suites</td>
      </tr>
      <tr>
        <td><strong>Deployment & Edge</strong></td>
        <td>Vercel (bom1 Mumbai Region)</td>
        <td>Edge proxy middleware, immutable static caching, and security headers</td>
      </tr>
    </tbody>
  </table>

  <!-- PAGE BREAK -->
  <div class="page-break"></div>

  <!-- SECTION 3 -->
  <h2><span class="num">3</span> Authentication & Security Flow</h2>
  <p>
    Security is maintained through Next.js proxy middleware (<code>src/proxy.ts</code>) paired with Supabase RLS policies.
  </p>

  <div class="callout">
    <strong>Auth Strategy:</strong> Staff log in using standard credentials authenticated against Supabase Auth. Parents log in via Admission Number + Password hash, issuing a tamper-proof signed JWT cookie (<code>parent_session</code>).
  </div>

  <pre>
┌─────────────────────────────────── ROUTING PROXY (src/proxy.ts) ───────────────────────────────────┐
│                                                                                                    │
│  Request Path: /dashboard/*                                                                        │
│                                                                                                    │
│  1. Check "parent_session" Cookie (jose JWT)                                                      │
│     ├── Valid & mustChangePassword == true  ──► Redirect /auth/parent-change-password              │
│     └── Valid parent role                   ──► Allow /dashboard/parent/* (Deny /dashboard/admin)  │
│                                                                                                    │
│  2. Check Supabase Auth Session (Admin / Staff)                                                    │
│     ├── Valid & role == 'admin'             ──► Allow /dashboard/admin/* and /dashboard/parent/*   │
│     └── Unauthenticated                     ──► Redirect /login with return target                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
  </pre>

  <!-- SECTION 4 -->
  <h2><span class="num">4</span> Detailed Portal Routes & Features</h2>

  <h3>4.1 Public Website Routes</h3>
  <ul>
    <li><strong><code>/</code> (Home):</strong> Hero dynamic carousel, trust pillars, curriculum cards, 3D gallery teaser, teacher profiles, and parent testimonials.</li>
    <li><strong><code>/about</code>:</strong> School legacy, pedagogy, mission, leadership profile, and campus highlights.</li>
    <li><strong><code>/programs</code>:</strong> Structured curricula (Infant Care, Toddlers, Playgroup, Nursery, Kindergarten, Daycare).</li>
    <li><strong><code>/gallery</code>:</strong> Full-screen 3D Dome Gallery enabling 360-degree interactive photo exploration.</li>
    <li><strong><code>/admissions</code>:</strong> Admissions roadmap, fee schedules, eligibility criteria, downloadable brochure, and online enquiry.</li>
    <li><strong><code>/contact</code>:</strong> Interactive map, operating hours, phone/email directory, and visitor dispatch form.</li>
    <li><strong><code>/parent-corner</code>:</strong> Child development resources, healthy eating guides, and handbook policies.</li>
    <li><strong><code>/login</code>:</strong> Unified portal switchable between Administrator and Parent admission logins.</li>
  </ul>

  <h3>4.2 Admin Management Dashboard (<code>/dashboard/admin/*</code>)</h3>
  <ul>
    <li><strong><code>/dashboard/admin</code>:</strong> Operational KPIs (active enrollments, monthly collections, staff counts, attendance rates).</li>
    <li><strong><code>/dashboard/admin/students</code>:</strong> Student directory with class filters, search, modal editors, and Excel/CSV bulk import/export.</li>
    <li><strong><code>/dashboard/admin/fees</code>:</strong> Fee structure generation, partial/full payment logging, receipt generation, and status tracking.</li>
    <li><strong><code>/dashboard/admin/attendance</code>:</strong> Quick daily attendance marker across all programs with historical rollbacks.</li>
    <li><strong><code>/dashboard/admin/teachers</code>:</strong> Teacher and staff profiles, assigned classes, and contact directories.</li>
    <li><strong><code>/dashboard/admin/announcements</code>:</strong> Circular publisher with priority tags (Urgent, Event, General) and publishing toggle.</li>
    <li><strong><code>/dashboard/admin/enquiries</code>:</strong> Inbound prospective parent inquiry manager with lead statuses (New, Contacted, Enrolled).</li>
    <li><strong><code>/dashboard/admin/notes</code>:</strong> Student-specific feedback notes categorized by Academic, Behavioral, Health, or General.</li>
    <li><strong><code>/dashboard/admin/messages</code>:</strong> Real-time messaging inbox to chat directly with individual parents.</li>
    <li><strong><code>/dashboard/admin/reports</code>:</strong> Graphical analytics on enrollment trajectories, fee collection curves, and attendance.</li>
  </ul>

  <!-- PAGE BREAK -->
  <div class="page-break"></div>

  <h3>4.3 Parent Portal (<code>/dashboard/parent/*</code>)</h3>
  <ul>
    <li><strong><code>/dashboard/parent</code>:</strong> Overview hub showing child's basic record, recent teacher remarks, upcoming events, and quick notices.</li>
    <li><strong><code>/dashboard/parent/attendance</code>:</strong> Monthly interactive attendance calendar with color-coded Present, Absent, and Holiday badges.</li>
    <li><strong><code>/dashboard/parent/fees</code>:</strong> Invoices, due dates, outstanding dues, payment history, and one-click printable PDF receipts.</li>
    <li><strong><code>/dashboard/parent/announcements</code>:</strong> Filtered school circulars and notices relevant to the child's grade level.</li>
    <li><strong><code>/dashboard/parent/events</code>:</strong> Activity calendar with event details, dates, and dress code instructions.</li>
    <li><strong><code>/dashboard/parent/notes</code>:</strong> Historical remarks from teachers regarding academic growth and behavioral observations.</li>
    <li><strong><code>/dashboard/parent/chat</code>:</strong> Direct real-time chat interface connecting parents directly to teachers and administrators.</li>
    <li><strong><code>/dashboard/parent/profile</code>:</strong> Emergency contact records, address validation, and password reset panel.</li>
  </ul>

  <!-- SECTION 5 -->
  <h2><span class="num">5</span> Database Schema & Relationship Map</h2>
  <table>
    <thead>
      <tr>
        <th>Table Name</th>
        <th>Primary Keys & References</th>
        <th>Description & Responsibilities</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>students</code></td>
        <td><code>id (PK)</code>, <code>admission_no (UQ)</code></td>
        <td>Master records, admission credentials, password hashes, program level, parent info</td>
      </tr>
      <tr>
        <td><code>profiles</code></td>
        <td><code>id (PK -> auth.users)</code></td>
        <td>User identity tied to Supabase Auth; stores <code>role ('admin' | 'parent')</code> and name</td>
      </tr>
      <tr>
        <td><code>attendance</code></td>
        <td><code>id (PK)</code>, <code>student_id (FK)</code></td>
        <td>Daily attendance status (<code>present</code>, <code>absent</code>, <code>late</code>, <code>excused</code>) per date</td>
      </tr>
      <tr>
        <td><code>fees</code></td>
        <td><code>id (PK)</code>, <code>student_id (FK)</code></td>
        <td>Billing records, fee types (Tuition, Transport, Activity), amount, due dates, payment status</td>
      </tr>
      <tr>
        <td><code>payments</code></td>
        <td><code>id (PK)</code>, <code>fee_id (FK)</code></td>
        <td>Transaction records, auto-generated receipt numbers, payment methods, transaction timestamps</td>
      </tr>
      <tr>
        <td><code>announcements</code></td>
        <td><code>id (PK)</code></td>
        <td>School-wide or class-specific circulars with priority flags and publish toggles</td>
      </tr>
      <tr>
        <td><code>events</code></td>
        <td><code>id (PK)</code></td>
        <td>Academic calendar entries, festivals, parent-teacher meetings, holidays</td>
      </tr>
      <tr>
        <td><code>notes</code></td>
        <td><code>id (PK)</code>, <code>student_id (FK)</code></td>
        <td>Teacher remarks and developmental milestone logs per student</td>
      </tr>
      <tr>
        <td><code>teachers</code></td>
        <td><code>id (PK)</code></td>
        <td>Faculty directory with designations, bio, qualifications, and profile photos</td>
      </tr>
      <tr>
        <td><code>enquiries</code></td>
        <td><code>id (PK)</code></td>
        <td>Leads generated from public admissions forms with follow-up tracking statuses</td>
      </tr>
      <tr>
        <td><code>chat_messages</code></td>
        <td><code>id (PK)</code>, <code>student_id (FK)</code></td>
        <td>Two-way conversation history between school staff and parents</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 6 -->
  <h2><span class="num">6</span> Codebase Directory Layout</h2>
  <pre>
preschool-website/
├── public/                 # Static imagery, badges, brand assets
├── src/
│   ├── app/                # Next.js App Router root
│   │   ├── api/            # API Endpoints (chat, parent-login, enquiry, data-sync)
│   │   ├── dashboard/
│   │   │   ├── admin/      # 11 Dedicated Admin Management routes
│   │   │   └── parent/     # 8 Parent Portal routes
│   │   ├── (public pages)  # /, /about, /programs, /gallery, /admissions, /contact, /login
│   │   ├── layout.tsx      # App wrapper (Font definitions, Header, Footer, Providers)
│   │   └── globals.css     # Global styles & Tailwind layers
│   ├── components/
│   │   ├── DomeGallery/    # 3D interactive spherical gallery
│   │   ├── chat/           # Chat window, message threads, unread badge counters
│   │   ├── dashboard/      # DataTable, Modal, StatCard, EmptyState, Printable Receipt
│   │   └── ui/             # Radix buttons, inputs, alerts, dropdowns
│   ├── lib/
│   │   ├── auth-context.tsx    # Unified Auth Context provider
│   │   ├── data-store.ts       # Central data layer with Supabase + fallback resilience
│   │   ├── excel-import.ts     # Bulk student Excel & CSV parser
│   │   ├── excel-export.ts     # Comprehensive reporting exporter
│   │   ├── supabase.ts         # Browser Supabase client
│   │   └── types.ts            # Canonical TypeScript domain types
│   └── proxy.ts            # Next.js Edge proxy for route guarding
├── schema.sql              # PostgreSQL DDL, Foreign Keys & RLS policies
├── migration_*.sql         # Migration history scripts
└── package.json            # Scripts, dependencies, and engine configs
  </pre>

  <!-- SECTION 7 -->
  <h2><span class="num">7</span> Developer & Deployment Reference</h2>
  <div class="card">
    <div class="card-title">🚀 Local Development & Build Commands</div>
    <p>
      <code>npm run dev</code> — Start local dev server at <code>localhost:3000</code><br>
      <code>npm run build</code> — Build optimized production bundle<br>
      <code>npm run test</code> — Run Jest unit and component test suites<br>
      <code>npm run test:e2e</code> — Run Playwright browser automation suites
    </p>
  </div>
  <div class="card" style="margin-top: 10px;">
    <div class="card-title">🔑 Environment Setup (<code>.env.local</code>)</div>
    <p>
      <code>NEXT_PUBLIC_SUPABASE_URL</code> — Supabase project API URL<br>
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — Supabase public client key<br>
      <code>SUPABASE_SERVICE_ROLE_KEY</code> — Private server key for signing parent JWTs
    </p>
  </div>

</body>
</html>
`;

  console.log('Setting page content...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  const outputPath = path.join(__dirname, '..', 'Tiny_Mind_Preschool_Documentation.pdf');
  console.log('Rendering PDF to:', outputPath);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '16mm',
      right: '16mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; font-size: 9px; color: #94a3b8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: space-between; padding: 0 16mm;">
        <span>Tiny Mind Play School — Confidential Technical Documentation</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  console.log('PDF Generated successfully at:', outputPath);
}

generatePDF().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
