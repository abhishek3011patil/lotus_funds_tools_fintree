from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(r"C:\offlice\fintree")
OUTPUT = ROOT / "output" / "pdf" / "Lotusfunds_SRS_Gap_Analysis_2026-08-05.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#102A43")
BLUE = colors.HexColor("#1976D2")
TEAL = colors.HexColor("#0F8B8D")
GREEN = colors.HexColor("#2E7D32")
AMBER = colors.HexColor("#ED8B00")
RED = colors.HexColor("#C62828")
INK = colors.HexColor("#243B53")
MUTED = colors.HexColor("#627D98")
LIGHT = colors.HexColor("#F4F7FA")
LINE = colors.HexColor("#D9E2EC")
PALE_BLUE = colors.HexColor("#EAF3FC")
PALE_RED = colors.HexColor("#FDECEC")
PALE_AMBER = colors.HexColor("#FFF4DE")
PALE_GREEN = colors.HexColor("#EAF6EC")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleX", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=27, leading=31, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name="SubTitleX", parent=styles["Normal"], fontName="Helvetica", fontSize=12, leading=17, textColor=MUTED, spaceAfter=12))
styles.add(ParagraphStyle(name="H1X", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=NAVY, spaceBefore=5, spaceAfter=8))
styles.add(ParagraphStyle(name="H2X", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=BLUE, spaceBefore=7, spaceAfter=5))
styles.add(ParagraphStyle(name="BodyX", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.2, leading=13.1, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="SmallX", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.5, leading=10.2, textColor=INK))
styles.add(ParagraphStyle(name="TinyX", parent=styles["BodyText"], fontName="Helvetica", fontSize=6.7, leading=8.6, textColor=INK))
styles.add(ParagraphStyle(name="CalloutX", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=NAVY))
styles.add(ParagraphStyle(name="FootX", parent=styles["BodyText"], fontName="Helvetica", fontSize=6.6, leading=8, textColor=MUTED))


def P(text, style="BodyX"):
    return Paragraph(text, styles[style])


def bullet(text, color=INK):
    return Paragraph(f'<font color="{color.hexval()}">-</font> {text}', styles["BodyX"])


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = doc.pagesize
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(16 * mm, h - 13 * mm, w - 16 * mm, h - 13 * mm)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.drawString(16 * mm, h - 9.7 * mm, "LOTUS FUNDS - SRS GAP ANALYSIS")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(w - 16 * mm, h - 9.7 * mm, "Assessment date: 05 Aug 2026")
    canvas.line(16 * mm, 13 * mm, w - 16 * mm, 13 * mm)
    canvas.drawString(16 * mm, 8.7 * mm, "Technical evidence review - not a legal or regulatory certification")
    canvas.drawRightString(w - 16 * mm, 8.7 * mm, f"Page {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=16 * mm,
    rightMargin=16 * mm,
    topMargin=18 * mm,
    bottomMargin=17 * mm,
    title="Lotus Funds SRS Gap Analysis",
    author="Codex",
    subject="Comparison of Lotusfunds SRS, 5augplain.sql, and the fintree repository",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates(PageTemplate(id="report", frames=[frame], onPage=header_footer))

story = []

# Cover
story += [Spacer(1, 21 * mm), P("Lotus Funds", "SubTitleX"), P("SRS Gap Analysis", "TitleX")]
story += [P("Latest database schema and application evidence compared with the Phase 1 Software Requirements Specification", "SubTitleX")]
story += [Spacer(1, 4 * mm)]
cover_box = Table(
    [
        [P("ASSESSMENT OUTCOME", "SmallX")],
        [P("Phase 1 is not yet ready for regulated production sign-off.", "CalloutX")],
        [P("Core foundations exist, but several controls that determine who may publish research, who receives it, and how immutable delivery evidence is retained are incomplete or absent.", "BodyX")],
    ],
    colWidths=[doc.width],
)
cover_box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), PALE_BLUE),
    ("BOX", (0, 0), (-1, -1), 0.8, BLUE),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [cover_box, Spacer(1, 10 * mm)]

meta = [
    [P("Source", "SmallX"), P("Evidence reviewed", "SmallX")],
    [P("SRS", "SmallX"), P("Lotusfunds SRS.pdf - 44 pages - supplied 05 Aug 2026", "SmallX")],
    [P("Database", "SmallX"), P("5augplain.sql - PostgreSQL dump - 33 tables, 550 columns, 8 triggers", "SmallX")],
    [P("Application", "SmallX"), P("C:\\offlice\\fintree - backend, frontend, API specification, tests", "SmallX")],
    [P("Validation", "SmallX"), P("Backend tests 23/23; frontend tests 19/19; frontend build passed; OpenAPI 83 operations validated; backend build failed", "SmallX")],
]
t = Table(meta, colWidths=[31 * mm, doc.width - 31 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("GRID", (0, 0), (-1, -1), 0.35, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story += [t, Spacer(1, 7 * mm), P("Prepared: 05 Aug 2026 (Asia/Calcutta)", "SmallX"), PageBreak()]

# Executive summary
story += [P("1. Executive summary", "H1X")]
story += [P("The implementation has substantial building blocks: detailed RA and broker onboarding, payment and subscription infrastructure, research call drafts and Errata, disclaimer snapshots, WhatsApp/Telegram delivery components, audit logs, and an API specification. These foundations reduce the amount of greenfield work remaining.")]
story += [P("However, the current evidence does not demonstrate end-to-end compliance with the SRS. The highest-risk gap is authorization: the research-call creation route authenticates a bearer token and checks subscription features, but the inspected route/controller does not explicitly require the Research Analyst role, verified/active RA status, or unexpired SEBI registration before inserting a call. This must be corrected before production use.")]

cards = [
    [P("P0", "CalloutX"), P("8", "CalloutX"), P("Production/compliance blockers", "SmallX")],
    [P("P1", "CalloutX"), P("8", "CalloutX"), P("Required for Phase 1 completeness", "SmallX")],
    [P("P2 / verify", "CalloutX"), P("6", "CalloutX"), P("Enhancements or operational proof", "SmallX")],
]
ct = Table(cards, colWidths=[35 * mm, 22 * mm, doc.width - 57 * mm])
ct.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), PALE_RED),
    ("BACKGROUND", (0, 1), (-1, 1), PALE_AMBER),
    ("BACKGROUND", (0, 2), (-1, 2), PALE_BLUE),
    ("GRID", (0, 0), (-1, -1), 0.4, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story += [Spacer(1, 4 * mm), ct, Spacer(1, 5 * mm)]

story += [P("Recommended release decision", "H2X")]
story += [bullet("Do not treat the current state as Phase 1 production-complete for regulated research distribution.", RED)]
story += [bullet("Create a compliance release gate around the eight P0 items in this report.", RED)]
story += [bullet("Retest authorization, immutability, recipient evidence, suspension, and performance calculations using adversarial integration tests.", RED)]

story += [P("What is already evidenced", "H2X")]
for x in [
    "RA and broker registration data, document fields, approval/rejection states, and profile update requests.",
    "Subscription plan catalog, feature/limit controls, payment orders/transactions, Razorpay webhook events, and subscription lifecycle records.",
    "Research call Draft/Publish behavior, an originating-RA Errata chain, version history, stored published message text, and message-template snapshots.",
    "RA disclaimer history and per-call disclaimer text snapshots.",
    "WhatsApp participants/jobs/messages, Telegram users/jobs/messages, notification records, and general audit logging.",
    "Underlying Study input and searchable UI code, including a broad predefined list.",
]:
    story.append(bullet(x, GREEN))
story += [PageBreak()]

# P0 table
story += [P("2. P0 blockers - resolve before regulated production", "H1X")]
p0 = [
    ("P0-01", "Research publishing authorization", "Partial", "Creation and publish endpoints are authenticated, but no explicit RA-role, approved/active RA, or unexpired SEBI check was found in the inspected call route/controller.", "Add a single server-side policy guard; deny by default; test CLIENT, BROKER, suspended RA, expired SEBI, and forged-plan cases."),
    ("P0-02", "RBAC and actor model", "Partial", "users.role only permits RESEARCH_ANALYST, BROKER, CLIENT. SUPERADMIN, ADMIN, content/design, and guest are not represented consistently; company_users is a second user store with an unconstrained role.", "Unify identity/roles or formally isolate stores; implement permission tables/policies and endpoint-level tests."),
    ("P0-03", "Published-call immutability", "Partial", "Errata is implemented, but all 8 database triggers are timestamp-maintenance triggers. No database guard prevents UPDATE/DELETE of a published call; application PATCH paths exist for publish/exit.", "Add database immutability rules with narrowly defined lifecycle transitions; revoke direct writes; retain append-only audit evidence."),
    ("P0-04", "Audience targeting", "Missing", "No call-target, selected-broker, direct-subscriber, or all-subscriber relation exists in the 33-table schema. Delivery currently follows participant lists rather than a locked audience snapshot.", "Model audience selection and immutable recipient snapshots before publishing; enforce broker scope and RA ownership."),
    ("P0-05", "Delivery handshake and recipient audit", "Missing", "WhatsApp stores sent_at and jobs; Telegram has jobs/messages. No common per-recipient accepted/delivered/read/failed ledger with receiver-side timestamp was found.", "Create channel-neutral delivery_attempt and delivery_receipt records, provider IDs, retry history, timestamps, and evidence retention."),
    ("P0-06", "Research/non-research segregation", "Missing", "No content/article/blog/newsletter/version/edit-log tables or content API were found. Client blog pages are present but do not evidence a governed CMS.", "Build a separate non-research content domain with classification, author/organization attribution, moderation boundaries, versioning, archive/unpublish, and recommendation-content validation."),
    ("P0-07", "RA classification and broker assignment", "Missing", "The schema has RA and broker detail records, but no Independent/Broker-Hired/Organizational classification or RA-to-broker assignment relation.", "Add classification, ownership, effective-dated assignments, publishing scope, and Phase 2 TPBRA isolation."),
    ("P0-08", "Suspension cascade and performance freeze", "Partial", "User/subscription suspension fields exist. Evidence does not show an atomic cascade placing subscriptions on hold, notifying clients, blocking all publishing, and freezing performance as specified.", "Implement one auditable suspension workflow and reinstate only after explicit clearance; add effective-date performance rules."),
]

rows = [[P("ID", "TinyX"), P("Requirement", "TinyX"), P("State", "TinyX"), P("Evidence / gap", "TinyX"), P("Required action", "TinyX")]]
for item in p0:
    rows.append([P(item[0], "TinyX"), P(item[1], "TinyX"), P(item[2], "TinyX"), P(item[3], "TinyX"), P(item[4], "TinyX")])
tab = Table(rows, colWidths=[13*mm, 29*mm, 15*mm, 62*mm, 59*mm], repeatRows=1)
tab.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("GRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("BACKGROUND", (0,1), (-1,-1), colors.white),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4),
    ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story += [tab, PageBreak()]

# P1
story += [P("3. P1 gaps - required for Phase 1 completeness", "H1X")]
p1 = [
    ("P1-01", "Mandatory call data", "Partial", "Instrument, Buy/Sell, entry, target, stop-loss, horizon and study are present. HOLD is disallowed by the DB; lot size, stored/calculated risk-reward, and explicit ownership classification are absent.", "Align SRS semantics and validations; decide whether HOLD belongs in Phase 1; calculate ratio deterministically."),
    ("P1-02", "Disclaimer version identity", "Partial", "RA disclaimer history and call text snapshots exist, but research_calls does not store disclaimer_history.id/version_number; broker/content disclaimer versioning is absent.", "Reference an immutable disclaimer version ID on each publication and retain the rendered text snapshot."),
    ("P1-03", "RA/broker/client subscriptions", "Partial", "Generic user-plan subscriptions are strong, but no subscriber-to-RA or subscriber-to-broker relationship is modeled for routing and entitlement.", "Add subscription subject/beneficiary relations and effective-dated entitlement snapshots."),
    ("P1-04", "Central notifications", "Partial", "A notification table and email templates exist, but notifications have no recipient user ID, delivery preferences, or channel delivery state. SRS reminders/content/announcement flows are not fully evidenced.", "Create recipient-aware notification events, preferences, outbox/delivery state, retry, and expiry reminder scheduling."),
    ("P1-05", "Performance correctness", "Partial", "Latest Errata rows are selected and a calculation service exists, but no complete proof was found for SRS treatment of suspension freeze, public SEBI visibility, multi-target/lot-size logic, and benchmarked calculations.", "Define signed calculation rules, golden datasets, versioned methodology, and audit-friendly result snapshots."),
    ("P1-06", "White-label broker branding", "Missing", "Broker legal/trade name exists, but no logo, color theme, contact snapshot, branding version, or immutable rendering evidence was found.", "Add broker display name, branding assets/version, allowed fields, and publication-time branding snapshot."),
    ("P1-07", "Terms and consent versioning", "Partial", "Declaration booleans exist in ra_details, but no terms/policy document version, accepted_at, IP/device, or signature evidence table was found.", "Store versioned legal documents and append-only acceptance records per actor."),
    ("P1-08", "Production build and release hygiene", "Partial", "Frontend build passes. Backend tsc fails because tests/config files are matched outside src rootDir. Test/debug routes and console logging remain in production paths.", "Fix tsconfig include/exclude or rootDir, remove debug endpoints/logs, and make build/test/security checks mandatory in CI."),
]
rows = [[P("ID", "SmallX"), P("Gap and current evidence", "SmallX"), P("Next action", "SmallX")]]
for i, title, state, evidence, action in p1:
    rows.append([P(f"<b>{i}</b><br/>{state}", "SmallX"), P(f"<b>{title}</b><br/>{evidence}", "SmallX"), P(action, "SmallX")])
tab = Table(rows, colWidths=[24*mm, 88*mm, 66*mm], repeatRows=1)
tab.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("GRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
]))
story += [tab, PageBreak()]

# P2 + NFR
story += [P("4. P2 enhancements and operational proof", "H1X")]
p2_items = [
    ("Auto-publish and broker media tiers", "Subscription tiers exist, but no scheduled publication time/job model or explicit Premium/Automated broker behavior was evidenced."),
    ("30-day cookies and login OTP", "Password/reset OTP flows and JWT authentication exist. A consistent 30-day cookie/session policy and inactivity timeout enforcement were not evidenced; auth uses bearer headers."),
    ("Underlying Study personalization", "The field and searchable options exist. Persisted frequently-used and last-five selections were not found."),
    ("Public/guest experience", "CLIENT routes/pages exist, but guest educational content and SEBI-governed public performance access were not evidenced."),
    ("Mobile version management", "No Android/iOS application or minimum-version/forced-upgrade service was found in the reviewed repository."),
    ("Broker/API future boundary", "Broker onboarding exists, but an explicit current Non-API versus future API broker capability boundary was not found."),
]
for title, body in p2_items:
    story += [KeepTogether([P(title, "H2X"), P(body)])]

story += [P("Non-functional requirements requiring environment evidence", "H2X")]
story += [P("These cannot be proven from a SQL dump and source tree alone. They need infrastructure configuration, monitoring, test results, and operating procedures.")]
nfr = [
    [P("Requirement", "SmallX"), P("Evidence required for sign-off", "SmallX")],
    [P("Encryption at rest and in transit", "SmallX"), P("Database/storage encryption settings, key management, TLS enforcement, secret rotation, field protection for PAN/bank/identity data.", "SmallX")],
    [P("Publishing latency under 2 seconds", "SmallX"), P("Load test with agreed concurrency and percentile target; clarify whether the target ends at database commit or provider acceptance.", "SmallX")],
    [P("99.5% availability", "SmallX"), P("Service-level indicators, monitoring, alerting, incident records, dependency targets, and maintenance-window policy.", "SmallX")],
    [P("Backup and disaster recovery", "SmallX"), P("Automated backup schedule, retention, encryption, off-site copy, restore test, RPO/RTO, and documented recovery runbook.", "SmallX")],
    [P("Hacked RA / DDoS response", "SmallX"), P("MFA, token/session revocation, anomaly and velocity limits, per-RA publish circuit breaker, WAF/rate controls, alerting, emergency suspension, and incident drill.", "SmallX")],
]
nt = Table(nfr, colWidths=[48*mm, 130*mm], repeatRows=1)
nt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("GRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
]))
story += [Spacer(1, 3*mm), nt, PageBreak()]

# Database findings
story += [P("5. Database-specific findings", "H1X")]
story += [P("The database is strongest around registration, billing/subscriptions, payment traceability, research-call version data, and channel-specific delivery queues. It is weakest around relationship modeling and compliance-enforcement constraints.")]
db_summary = [
    [P("Area", "SmallX"), P("Observed", "SmallX"), P("Assessment", "SmallX")],
    [P("Schema size", "SmallX"), P("33 tables; 550 parsed columns", "SmallX"), P("Material implementation, not an empty prototype", "SmallX")],
    [P("Triggers", "SmallX"), P("8 triggers, all associated with updated_at maintenance", "SmallX"), P("No evidenced published-call immutability guard", "SmallX")],
    [P("Research", "SmallX"), P("research_calls, exits, modifications, Errata via parent/version fields, templates", "SmallX"), P("Good version foundation; missing targeting, ownership class, lot size and risk-reward", "SmallX")],
    [P("Subscriptions", "SmallX"), P("plans, features, limits, events, usage, payments, webhook events", "SmallX"), P("Strong commercial foundation; missing RA/broker subscription subject relation", "SmallX")],
    [P("Delivery", "SmallX"), P("WhatsApp and Telegram participants/jobs/messages", "SmallX"), P("Channel-specific; missing common immutable recipient and receipt ledger", "SmallX")],
    [P("Content", "SmallX"), P("No governed non-research content/version tables", "SmallX"), P("Phase 1 functional gap", "SmallX")],
    [P("Identity", "SmallX"), P("users plus company_users; inconsistent role representation", "SmallX"), P("Authorization and lifecycle risk", "SmallX")],
]
dt = Table(db_summary, colWidths=[31*mm, 80*mm, 67*mm], repeatRows=1)
dt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("GRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
]))
story += [dt, Spacer(1, 5*mm)]
story += [P("Important schema mismatch", "H2X")]
story += [P("The SRS describes a hierarchy with Super Admin, Admin/Broker, RA subtypes, content/design roles, platform client, broker-only client, and guest. The primary users table constrains role to RESEARCH_ANALYST, BROKER, or CLIENT, while application middleware expects ADMIN and SUPERADMIN. This may be intentional because company_users is separate, but the separation is not expressed as one coherent authorization model in the reviewed evidence.")]
story += [P("Important compliance mismatch", "H2X")]
story += [P("A disclaimer text snapshot is better than referencing only the current RA profile. For defensible traceability, each research call should additionally reference the exact disclaimer history row/version. Broker and non-research content disclaimers need the same versioned approach.")]
story += [PageBreak()]

# Application validation
story += [P("6. Application validation results", "H1X")]
validation = [
    [P("Check", "SmallX"), P("Result", "SmallX"), P("Meaning", "SmallX")],
    [P("Backend unit/integration tests", "SmallX"), P("PASS - 4 files, 23 tests", "SmallX"), P("Existing covered behavior passes; coverage is not broad enough for SRS sign-off.", "SmallX")],
    [P("Frontend tests", "SmallX"), P("PASS - 2 files, 19 tests", "SmallX"), P("Utility/template behavior passes.", "SmallX")],
    [P("Frontend production build", "SmallX"), P("PASS with large-chunk warnings", "SmallX"), P("Deployable bundle produced; RegistrationPage chunk is about 8.65 MB uncompressed.", "SmallX")],
    [P("Backend production build", "SmallX"), P("FAIL", "SmallX"), P("TS6059: test/config files are included outside rootDir=src.", "SmallX")],
    [P("OpenAPI validation", "SmallX"), P("PASS - 83 operations", "SmallX"), P("Specification parses and validates; it does not prove authorization or runtime behavior.", "SmallX")],
]
vt = Table(validation, colWidths=[48*mm, 42*mm, 88*mm], repeatRows=1)
vt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("GRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("BACKGROUND", (0,4), (1,4), PALE_RED),
    ("ROWBACKGROUNDS", (0,1), (-1,3), [colors.white, LIGHT]),
    ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
]))
story += [vt, Spacer(1, 5*mm)]
story += [P("Security observations from inspected routes", "H2X")]
for x in [
    "A global rate limiter and Helmet are configured, which is useful baseline hardening.",
    "The research-call route does not show an explicit role/status/SEBI-expiry guard before create or publish.",
    "The authentication middleware verifies JWT signature and extracts claims, but does not consult user status or user_sessions for revocation/inactivity on each request.",
    "A broker list route and broker registration route are exposed without authentication in the inspected router; confirm whether this exposure is intentional and appropriately data-minimized.",
    "A test endpoint remains inside both admin and research routers.",
]:
    story.append(bullet(x, AMBER))
story += [PageBreak()]

# Roadmap
story += [P("7. Recommended implementation sequence", "H1X")]
roadmap = [
    ("Gate 1 - Identity and publishing control", "Unify role policy; add verified/active/SEBI-expiry guard; session revocation and inactivity; publish velocity/circuit breaker; fix backend build."),
    ("Gate 2 - Immutable research record", "Lock published calls at DB and service layers; formalize permitted lifecycle transitions; reference disclaimer version ID; complete required call fields."),
    ("Gate 3 - Audience and delivery evidence", "Create targeting/recipient snapshots, RA-broker assignments, subscriber subject relations, delivery attempts/receipts, and provider timestamps."),
    ("Gate 4 - Suspension and performance", "Atomic suspension cascade, client notification, performance freeze, signed calculation rules, Errata test matrices, and public visibility controls."),
    ("Gate 5 - Non-research and white label", "Separate content CMS, attribution/versioning, content safety rules, broker branding snapshots, announcements and recipient-aware notifications."),
    ("Gate 6 - Operational readiness", "Load/latency test, encrypted storage evidence, backup restore drill, monitoring/SLOs, security test, incident response drill, and compliance acceptance."),
]
for idx, (title, body) in enumerate(roadmap, 1):
    box = Table([[P(str(idx), "CalloutX"), P(f"<b>{title}</b><br/>{body}", "BodyX")]], colWidths=[13*mm, doc.width-13*mm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,0), NAVY), ("TEXTCOLOR", (0,0), (0,0), colors.white),
        ("BACKGROUND", (1,0), (1,0), LIGHT), ("BOX", (0,0), (-1,-1), 0.4, LINE),
        ("ALIGN", (0,0), (0,0), "CENTER"), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ]))
    story += [box, Spacer(1, 2.5*mm)]

story += [P("Definition of done for Phase 1", "H2X")]
for x in [
    "Every SRS requirement has an owner, acceptance criteria, automated or manual evidence, and a final status.",
    "Negative authorization tests prove that every non-RA or ineligible RA cannot publish or issue Errata.",
    "A published call, its disclaimer version, selected audience, recipient list, rendered message, timestamps, and delivery outcomes can be reconstructed without relying on mutable profile data.",
    "Suspension immediately blocks publishing/distribution and produces auditable subscription, notification, and performance effects.",
    "Production builds are repeatable and all required tests, backup restore, load, security, and monitoring gates pass.",
]:
    story.append(bullet(x, GREEN))
story += [PageBreak()]

# Appendix matrix
story += [P("Appendix A - SRS coverage snapshot", "H1X")]
matrix = [
    ("Governance roles", "Partial", "Admin middleware and separate company users exist; coherent full hierarchy not evidenced."),
    ("RA onboarding", "Evidenced", "Detailed RA documents, dates, declarations, approval and update request data."),
    ("Broker onboarding", "Evidenced", "Detailed legal/compliance/document fields and lifecycle status."),
    ("Research call Draft/Publish", "Evidenced", "Draft and publish paths exist."),
    ("Only eligible RA may publish", "Partial", "Subscription checks exist; explicit role/verification/expiry guard not evidenced."),
    ("Errata", "Evidenced", "Originating-RA ownership, version chain and reason are implemented."),
    ("Published immutability", "Partial", "Application convention exists; DB-level protection not evidenced."),
    ("Call targeting", "Missing", "No selected audience or immutable recipient snapshot model."),
    ("Broker read-only scope", "Partial", "UI/routes exist; complete server-side object authorization not demonstrated."),
    ("White label", "Missing", "No governed branding/version snapshot model."),
    ("Non-research CMS", "Missing", "No content/version domain evidenced."),
    ("Disclaimer versioning", "Partial", "RA history and call snapshot exist; exact version ID and other actor/content scope missing."),
    ("Subscription management", "Evidenced", "Strong generic plan/payment/lifecycle foundation."),
    ("RA/broker-specific entitlement", "Missing", "No subscription subject/beneficiary relationship."),
    ("Notifications", "Partial", "Table and channel/email components exist; recipient-centric orchestration incomplete."),
    ("Audit", "Partial", "General audit table/logger exists; access/distribution and immutable evidence incomplete."),
    ("Suspension", "Partial", "Status/reason fields exist; complete cascade and performance freeze not evidenced."),
    ("Performance", "Partial", "Calculation service exists; regulatory/freeze/benchmark evidence incomplete."),
    ("Underlying Study", "Partial", "Input/search list exists; frequency/last-five personalization missing."),
    ("Security/availability/NFR", "Verify", "Requires infrastructure and operational evidence."),
]
rows = [[P("Requirement area", "SmallX"), P("Status", "SmallX"), P("Basis", "SmallX")]]
for a,b,c in matrix:
    rows.append([P(a,"SmallX"),P(b,"SmallX"),P(c,"SmallX")])
mt = Table(rows, colWidths=[55*mm, 25*mm, 98*mm], repeatRows=1)
mt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("GRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story += [mt, Spacer(1,4*mm)]
story += [P("Assessment limitation", "H2X"), P("This is a point-in-time technical evidence review of the supplied SRS, SQL dump, and repository. It did not connect to a live database, inspect cloud/network configuration, execute end-to-end channel delivery, perform penetration testing, or provide legal interpretation. Items marked Verify require separate operational evidence.")]

doc.build(story)
print(OUTPUT)
