import api from "../../utils/axio";
import type {
  AnalystListResponse,
  AnalystOrderResponse,
  BrokerListResponse,
  MarketplaceProfileResponse,
  RazorpayPaymentResult,
} from "./types";

export const fetchMarketplaceProfile = async (
  type: "analyst" | "broker",
  id: string,
  period: "monthly" | "yearly",
  signal?: AbortSignal
) => {
  const path = type === "broker"
    ? `/client/analysts/brokers/${encodeURIComponent(id)}/profile`
    : `/client/analysts/${encodeURIComponent(id)}/profile`;
  return (await api.get<MarketplaceProfileResponse>(path, { params: { period }, signal })).data;
};

export const fetchClientAnalysts = async (
  search: string,
  page: number,
  signal?: AbortSignal
) => {
  const response = await api.get<AnalystListResponse>("/client/analysts", {
    params: { search, page, limit: 12 },
    signal,
  });
  return response.data;
};

export const fetchClientBrokers = async (
  search: string,
  page: number,
  signal?: AbortSignal
) => {
  const response = await api.get<BrokerListResponse>("/client/analysts/brokers", {
    params: { search, page, limit: 12 }, signal,
  });
  return response.data;
};

export const createBrokerOrder = async (brokerId: string) =>
  (await api.post<AnalystOrderResponse>(`/client/analysts/brokers/${encodeURIComponent(brokerId)}/order`)).data;

export const cancelBrokerSubscription = async (brokerId: string) =>
  (await api.patch(`/client/analysts/brokers/${encodeURIComponent(brokerId)}/cancel`)).data;

export const verifyBrokerPayment = async (payment: RazorpayPaymentResult) =>
  (await api.post("/client/analysts/brokers/payment/verify", {
    razorpayOrderId: payment.razorpay_order_id,
    razorpayPaymentId: payment.razorpay_payment_id,
    razorpaySignature: payment.razorpay_signature,
  })).data;

export const createAnalystOrder = async (raUserId: string) => {
  const response = await api.post<AnalystOrderResponse>(
    `/client/analysts/${encodeURIComponent(raUserId)}/order`
  );
  return response.data;
};

export const cancelAnalystSubscription = async (raUserId: string) => {
  const response = await api.patch(
    `/client/analysts/${encodeURIComponent(raUserId)}/cancel`
  );
  return response.data;
};

export const verifyAnalystPayment = async (
  payment: RazorpayPaymentResult
) => {
  const response = await api.post("/client/analysts/payment/verify", {
    razorpayOrderId: payment.razorpay_order_id,
    razorpayPaymentId: payment.razorpay_payment_id,
    razorpaySignature: payment.razorpay_signature,
  });
  return response.data;
};
