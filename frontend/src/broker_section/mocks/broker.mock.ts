import type {
  BrokerAnnouncement,
  BrokerBranding,
  BrokerClient,
  BrokerDashboardData,
  BrokerNotification,
  BrokerPerformanceRow,
  BrokerResearchAnalyst,
  BrokerResearchCall,
  BrokerSubscription,
} from "../types/broker.types";

export const brokerResearchCalls: BrokerResearchCall[] = [
  { id: "call-101", symbol: "ALPHATECH", action: "BUY", entry: "₹842", entryRange: "₹838–₹846", targets: ["₹872", "₹895"], stopLosses: ["₹818"], timeHorizon: "2–4 weeks", raName: "Aarav Mehta Research", audience: "184 active clients", status: "OPEN", publishedAt: "2026-07-30T09:35:00+05:30", disclaimerVersion: "RA v4", hasErrata: false, exitStatus: "Not exited" },
  { id: "call-102", symbol: "NORTHBANK", action: "SELL", entry: "₹516", entryRange: "₹512–₹518", targets: ["₹492"], stopLosses: ["₹529"], timeHorizon: "5–10 sessions", raName: "Meridian Insights", audience: "All subscribed clients", status: "CLOSED", publishedAt: "2026-07-28T11:10:00+05:30", disclaimerVersion: "RA v7", hasErrata: true, exitStatus: "Exited at ₹494" },
  { id: "call-103", symbol: "GREENPOWER", action: "BUY", entry: "₹274", entryRange: "₹270–₹276", targets: ["₹290", "₹304"], stopLosses: ["₹261"], timeHorizon: "1–3 months", raName: "Aarav Mehta Research", audience: "Growth segment · 72 clients", status: "OPEN", publishedAt: "2026-07-25T14:20:00+05:30", disclaimerVersion: "RA v4", hasErrata: false, exitStatus: "Not exited" },
];

export const brokerResearchAnalysts: BrokerResearchAnalyst[] = [
  { id: "ra-1", name: "Aarav Mehta Research", sebiRegistration: "INH000012345", category: "Fundamental Equity", subscriptionStatus: "Subscribed", registrationExpiry: "2027-03-31", performance: "68% successful closed calls", status: "ACTIVE" },
  { id: "ra-2", name: "Meridian Insights", sebiRegistration: "INH000067890", category: "Technical Equity", subscriptionStatus: "Subscribed", registrationExpiry: "2026-12-15", performance: "61% successful closed calls", status: "ACTIVE" },
  { id: "ra-3", name: "Blue Peak Analytics", sebiRegistration: "INH000054321", category: "Multi-asset", subscriptionStatus: "Paused", registrationExpiry: "2026-10-08", performance: "57% successful closed calls", status: "INACTIVE" },
];

export const brokerClients: BrokerClient[] = [
  { id: "client-1", displayName: "Client Aster", reference: "BR-1048", status: "ACTIVE", joinedAt: "2026-04-12" },
  { id: "client-2", displayName: "Client Birch", reference: "BR-1084", status: "ACTIVE", joinedAt: "2026-05-03" },
  { id: "client-3", displayName: "Client Cedar", reference: "BR-1121", status: "INACTIVE", joinedAt: "2026-06-19" },
];

export const brokerPerformance: BrokerPerformanceRow[] = [
  { id: "perf-1", raId: "ra-1", raName: "Aarav Mehta Research", calls: 42, closedCalls: 34, successRate: 68, averageReturn: 4.8, status: "ACTIVE" },
  { id: "perf-2", raId: "ra-2", raName: "Meridian Insights", calls: 31, closedCalls: 28, successRate: 61, averageReturn: 3.6, status: "ACTIVE" },
  { id: "perf-3", raId: "ra-3", raName: "Blue Peak Analytics", calls: 18, closedCalls: 16, successRate: 57, averageReturn: 2.9, status: "INACTIVE" },
];

export const brokerNotifications: BrokerNotification[] = [
  { id: "note-1", title: "New research call", message: "Aarav Mehta Research published a call for GREENPOWER.", createdAt: "2026-07-30T09:40:00+05:30", read: false },
  { id: "note-2", title: "Subscription update", message: "Your Premium Broker plan remains active through 31 March 2027.", createdAt: "2026-07-29T10:00:00+05:30", read: true },
];

export const brokerAnnouncements: BrokerAnnouncement[] = [
  { id: "ann-1", title: "Independence Day service hours", audience: "All clients", publishDate: "2026-08-14", status: "SCHEDULED" },
  { id: "ann-2", title: "Client portal maintenance", audience: "All clients", publishDate: "2026-07-20", status: "PUBLISHED" },
];

export const brokerBranding: BrokerBranding = { displayName: "Lotus Partner Securities", contactEmail: "support@example-broker.test", contactNumber: "+91 00000 00000", website: "https://broker.example.test", primaryColour: "#1e40af", brokerType: "Premium" };

export const brokerSubscription: BrokerSubscription = {
  details: { id: "sub-1", planName: "Premium Broker", status: "ACTIVE", startsAt: "2026-04-01", expiresAt: "2027-03-31", amountPaid: 48000, currency: "INR", daysRemaining: 242 },
  features: ["Up to 500 client profiles", "Subscribed RA research feed", "Broker branding controls", "Performance reporting"],
};

export const brokerDashboard: BrokerDashboardData = {
  metrics: { activeRAs: 2, clients: 184, callsReceived: 91, openCalls: 2, closedCalls: 89, subscriptionStatus: "Active" },
  recentCalls: brokerResearchCalls,
  performance: brokerPerformance,
  notifications: brokerNotifications,
};
