import { postJson } from '../../services/http';
import type { AssistantQueryPayload, AssistantQueryResponse } from './types';

export function sendAssistantMessage(payload: AssistantQueryPayload) {
  return postJson<AssistantQueryResponse>('/api/v1/assistant/chat', payload);
}
