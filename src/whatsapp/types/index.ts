/**
 * WhatsApp Bot - Type Definitions
 * Isolated module for WhatsApp Business API integration
 */

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface WhatsAppConfigDTO {
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  botName?: string;
  companyName: string;
  isActive?: boolean;
}

export interface WhatsAppConfigResponse {
  id: number;
  userId: number;
  wabaId: string;
  phoneNumberId: string;
  botName: string;
  companyName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CONVERSATION TYPES
// ============================================

export type ConversationState =
  | 'initial'
  | 'collecting_name'
  | 'collecting_intention'
  | 'collecting_property_type'
  | 'collecting_rooms'
  | 'showing_properties'
  | 'awaiting_selection'
  | 'completed';

export interface ConversationContext {
  customerName?: string;
  intention?: 'alquilar' | 'comprar';
  propertyType?: 'departamento' | 'casa' | 'local_comercial' | 'cochera';
  rooms?: number;
  shownProperties?: number[];
  selectedPropertyId?: number;
}

export interface ConversationDTO {
  id: number;
  configId: number;
  phoneNumber: string;
  customerName?: string;
  state: ConversationState;
  context: ConversationContext;
  lastMessageAt: Date;
  createdAt: Date;
}

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageDirection = 'incoming' | 'outgoing';

export interface ExtractedData {
  name?: string;
  intention?: 'alquilar' | 'comprar';
  propertyType?: 'departamento' | 'casa' | 'local_comercial' | 'cochera';
  rooms?: number;
  confidence?: number;
}

export interface MessageDTO {
  id: number;
  conversationId: number;
  direction: MessageDirection;
  content: string;
  messageId?: string;
  extractedData?: ExtractedData;
  createdAt: Date;
}

// ============================================
// WEBHOOK TYPES (Meta WhatsApp API)
// ============================================

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Array<{
      profile: {
        name: string;
      };
      wa_id: string;
    }>;
    messages?: WhatsAppIncomingMessage[];
    statuses?: WhatsAppMessageStatus[];
  };
  field: string;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}

export interface WhatsAppMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

// ============================================
// OPENAI TYPES
// ============================================

export interface OpenAIExtractionRequest {
  message: string;
  conversationContext: ConversationContext;
  currentState: ConversationState;
}

export interface OpenAIExtractionResponse {
  extractedData: ExtractedData;
  suggestedResponse: string;
  nextState: ConversationState;
  needsMoreInfo: boolean;
}

// ============================================
// PROPERTY SEARCH TYPES
// ============================================

export interface PropertySearchCriteria {
  userId: number;
  propertyType?: string;
  rooms?: number;
  status: string; // 'disponible'
}

export interface PropertyResult {
  id: number;
  nomenclature: string;
  propertyType: string;
  rooms: number;
  area: number;
  rentalPrice?: number;
  buildingName?: string;
  address?: string;
  city?: string;
  floor?: number;
  apartmentLetter?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WhatsAppSendMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}
