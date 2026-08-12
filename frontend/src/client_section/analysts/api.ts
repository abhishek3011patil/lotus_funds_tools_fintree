import api from "../../utils/axio";
import type {
  AnalystListResponse,
  AnalystOrderResponse,
  RazorpayPaymentResult,
} from "./types";

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

export const createAnalystOrder = async (raUserId: string) => {
  const response = await api.post<AnalystOrderResponse>(
    `/client/analysts/${encodeURIComponent(raUserId)}/order`
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
