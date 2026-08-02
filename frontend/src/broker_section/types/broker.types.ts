import type { SubscriptionDetails } from "../../types/subscription";

export type LoadState = "ready" | "loading" | "empty" | "error";
export type CallStatus = "OPEN" | "CLOSED";

export interface BrokerResearchCall {
  id: string;
  symbol: string;
  action: "BUY" | "SELL";
  entry: string;
  entryRange: string;
  targets: string[];
  stopLosses: string[];
  timeHorizon: string;
  raName: string;
  audience: string;
  status: CallStatus;
  publishedAt: string;
  disclaimerVersion: string;
  hasErrata: boolean;
  exitStatus: string;
}

export interface BrokerResearchAnalyst {
  id: string;
  name: string;
  sebiRegistration: string;
  category: string;
  subscriptionStatus: string;
  registrationExpiry: string;
  performance: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface BrokerClient {
  id: string;
  displayName: string;
  reference: string;
  status: "ACTIVE" | "INACTIVE";
  joinedAt: string;
}

export interface BrokerPerformanceRow {
  id: string;
  raId: string;
  raName: string;
  calls: number;
  closedCalls: number;
  successRate: number;
  averageReturn: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface BrokerNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface BrokerAnnouncement {
  id: string;
  title: string;
  audience: string;
  publishDate: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
}

export interface BrokerDashboardData {
  metrics: {
    activeRAs: number;
    clients: number;
    callsReceived: number;
    openCalls: number;
    closedCalls: number;
    subscriptionStatus: string;
  };
  recentCalls: BrokerResearchCall[];
  performance: BrokerPerformanceRow[];
  notifications: BrokerNotification[];
}

export interface BrokerBranding {
  displayName: string;
  contactEmail: string;
  contactNumber: string;
  website: string;
  primaryColour: string;
  brokerType: "Premium" | "Automated";
}

export interface BrokerSubscription {
  details: SubscriptionDetails;
  features: string[];
}
