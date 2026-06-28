export interface SpmCreateEventData {
  name: string;
  code_name: string;
  properties?: Record<string, unknown>;
}

export interface SpmUpdateEventData {
  id_event: number;
  name?: string;
  code_name?: string;
  properties?: Record<string, unknown>;
}

export interface SpmTriggerEventPayload {
  contact?: { id?: number; email?: string; phone?: string; customData?: Record<string, unknown> };
  visitor?: { id: number; customData?: Record<string, unknown> };
  metaData?: Record<string, unknown>;
  customData?: Record<string, unknown>;
}
