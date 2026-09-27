import api from "@/features/chat/data/http";
import { CallHistoryRecord } from "@/features/chat/types/call/types";

export async function getCallHistory(tenantId: string): Promise<CallHistoryRecord[]> {
    const res = await api.get(`/organization/${tenantId}/calls/history`);
    return res.data;
}

export async function getMissedCalls(tenantId: string): Promise<CallHistoryRecord[]> {
    const res = await api.get(`/organization/${tenantId}/calls/missed`);
    return res.data;
}
