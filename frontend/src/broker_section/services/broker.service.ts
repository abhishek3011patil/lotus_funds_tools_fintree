import {
  brokerAnnouncements,
  brokerBranding,
  brokerClients,
  brokerDashboard,
  brokerNotifications,
  brokerPerformance,
  brokerResearchAnalysts,
  brokerResearchCalls,
  brokerSubscription,
} from "../mocks/broker.mock";
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

export interface BrokerService {
  getDashboard(): Promise<BrokerDashboardData>;
  getResearchCalls(): Promise<BrokerResearchCall[]>;
  getResearchAnalysts(): Promise<BrokerResearchAnalyst[]>;
  getClients(): Promise<BrokerClient[]>;
  getPerformance(): Promise<BrokerPerformanceRow[]>;
  getAnnouncements(): Promise<BrokerAnnouncement[]>;
  getNotifications(): Promise<BrokerNotification[]>;
  getBranding(): Promise<BrokerBranding>;
  getSubscription(): Promise<BrokerSubscription>;
}

// API-dependent mutations intentionally remain outside this mock-backed branch.
export const brokerService: BrokerService = {
  getDashboard: async () => brokerDashboard,
  getResearchCalls: async () => brokerResearchCalls,
  getResearchAnalysts: async () => brokerResearchAnalysts,
  getClients: async () => brokerClients,
  getPerformance: async () => brokerPerformance,
  getAnnouncements: async () => brokerAnnouncements,
  getNotifications: async () => brokerNotifications,
  getBranding: async () => brokerBranding,
  getSubscription: async () => brokerSubscription,
};
