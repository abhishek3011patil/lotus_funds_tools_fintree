export interface DashboardSummary {
  subscribedRaCount: number;
  newCallsToday: number;
  activeCalls: number;
  unreadNotifications: number;
  expiringSoonCount: number;
}

export interface DashboardSubscription {
  id: string;
  name: string;
  organization: string | null;
  profileImage: string | null;
  expiresAt: string;
}

export interface DashboardCall {
  id: string;
  stockName: string;
  symbol: string;
  recommendationType: string;
  status: string;
  createdAt: string;
  entryPrice: string | null;
  targetPrice: string | null;
  stopLoss: string | null;
  raId: string;
  raName: string;
  raOrganization: string | null;
}

export interface ExpiringSubscription {
  id: string;
  raId: string;
  raName: string;
  organization: string | null;
  expiresAt: string;
  daysRemaining: number;
}

export interface DashboardAnalyst {
  id: string;
  name: string;
  organization: string | null;
  profileImage: string | null;
  sebiRegistrationNumber: string | null;
  expertise: string | null;
  markets: string | null;
  shortBio: string | null;
}

export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ClientDashboardResponse {
  success: boolean;
  summary: DashboardSummary;
  subscriptions: DashboardSubscription[];
  recentCalls: DashboardCall[];
  expiringSubscriptions: ExpiringSubscription[];
  discoverAnalysts: DashboardAnalyst[];
  notifications: DashboardNotification[];
}
