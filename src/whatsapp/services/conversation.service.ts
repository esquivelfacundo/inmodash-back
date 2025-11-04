/**
 * Conversation Service
 * Manages conversation state machine and flow
 */

import { PrismaClient } from '@prisma/client';
import { ConversationState, ConversationContext, ExtractedData, PropertySearchCriteria, PropertyResult } from '../types';
import { openaiService } from './openai.service';
import { whatsappService } from './whatsapp.service';

const prisma = new PrismaClient();

export class ConversationService {
  /**
   * Get or create conversation
   */
  async getOrCreateConversation(configId: number, phoneNumber: string) {
    let conversation = await prisma.conversation.findUnique({
      where: {
        configId_phoneNumber: {
          configId,
          phoneNumber
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          configId,
          phoneNumber,
          state: 'initial',
          context: '{}'
        }
      });
    }

    return conversation;
  }

  /**
   * Process incoming message and determine next action
   */
  async processMessage(
    conversationId: number,
    message: string,
    currentState: ConversationState,
    context: ConversationContext,
    botName: string,
    companyName: string,
    companyPhone: string
  ): Promise<{ response: string; nextState: ConversationState; updatedContext: ConversationContext }> {
    // Extract information from message
    const extracted = await openaiService.extractInformation(message, currentState, context);

    // Update context with extracted data
    const updatedContext = this.updateContext(context, extracted);

    // Determine next state
    const nextState = this.determineNextState(currentState, updatedContext);

    // Generate response
    let response: string;

    if (nextState === 'showing_properties') {
      // Search for properties
      response = await this.handlePropertySearch(updatedContext, companyPhone);
    } else if (nextState === 'awaiting_selection') {
      response = 'Por favor, indica el número de la propiedad que te interesa.';
    } else {
      // Generate natural response for next question
      response = await openaiService.generateResponse(
        extracted,
        nextState,
        updatedContext,
        botName,
        companyName
      );
    }

    return {
      response,
      nextState,
      updatedContext
    };
  }

  /**
   * Update conversation context with extracted data
   */
  private updateContext(context: ConversationContext, extracted: ExtractedData): ConversationContext {
    const updated = { ...context };

    if (extracted.name) updated.customerName = extracted.name;
    if (extracted.intention) updated.intention = extracted.intention;
    if (extracted.propertyType) updated.propertyType = extracted.propertyType;
    if (extracted.rooms !== undefined) updated.rooms = extracted.rooms;

    return updated;
  }

  /**
   * Determine next conversation state
   */
  private determineNextState(
    currentState: ConversationState,
    context: ConversationContext
  ): ConversationState {
    switch (currentState) {
      case 'initial':
        return 'collecting_name';

      case 'collecting_name':
        if (context.customerName) {
          return 'collecting_intention';
        }
        return 'collecting_name';

      case 'collecting_intention':
        if (context.intention) {
          // Check if property type was also mentioned
          if (context.propertyType) {
            // Check if rooms were mentioned
            if (context.rooms !== undefined) {
              return 'showing_properties';
            }
            return 'collecting_rooms';
          }
          return 'collecting_property_type';
        }
        return 'collecting_intention';

      case 'collecting_property_type':
        if (context.propertyType) {
          // Check if rooms were also mentioned
          if (context.rooms !== undefined) {
            return 'showing_properties';
          }
          return 'collecting_rooms';
        }
        return 'collecting_property_type';

      case 'collecting_rooms':
        if (context.rooms !== undefined) {
          return 'showing_properties';
        }
        return 'collecting_rooms';

      case 'showing_properties':
        return 'awaiting_selection';

      case 'awaiting_selection':
        return 'completed';

      case 'completed':
        return 'completed';

      default:
        return 'initial';
    }
  }

  /**
   * Handle property search and format response
   */
  private async handlePropertySearch(
    context: ConversationContext,
    companyPhone: string
  ): Promise<string> {
    try {
      // Search for properties
      const properties = await this.searchProperties({
        userId: 0, // Will be set by the controller
        propertyType: context.propertyType,
        rooms: context.rooms,
        status: 'disponible'
      });

      if (properties.length === 0) {
        return whatsappService.formatNoPropertiesMessage(companyPhone);
      }

      // Store shown properties in context
      context.shownProperties = properties.map(p => p.id);

      // Format properties list
      let response = `Perfecto! Encontré ${properties.length} ${properties.length === 1 ? 'propiedad' : 'propiedades'} disponible${properties.length === 1 ? '' : 's'}:\n\n`;

      // Send each property as separate message (will be handled by controller)
      properties.forEach((property, index) => {
        response += whatsappService.formatPropertyMessage(property, index + 1);
      });

      response += whatsappService.formatPropertiesListMessage(properties);

      return response;
    } catch (error) {
      console.error('Error searching properties:', error);
      return `Lo siento, hubo un error al buscar propiedades. ${whatsappService.formatContactMessage(companyPhone)}`;
    }
  }

  /**
   * Search properties based on criteria
   */
  private async searchProperties(criteria: PropertySearchCriteria): Promise<PropertyResult[]> {
    const where: any = {
      status: criteria.status
    };

    if (criteria.propertyType) {
      where.propertyType = criteria.propertyType;
    }

    if (criteria.rooms !== undefined) {
      where.rooms = criteria.rooms;
    }

    const apartments = await prisma.apartment.findMany({
      where,
      include: {
        building: {
          select: {
            name: true
          }
        }
      },
      take: 5 // Limit to 5 properties
    });

    return apartments.map(apt => ({
      id: apt.id,
      nomenclature: apt.nomenclature,
      propertyType: apt.propertyType,
      rooms: apt.rooms,
      area: apt.area,
      rentalPrice: apt.rentalPrice || undefined,
      buildingName: apt.building?.name,
      address: apt.fullAddress || undefined,
      city: apt.city || undefined,
      floor: apt.floor || undefined,
      apartmentLetter: apt.apartmentLetter || undefined
    }));
  }

  /**
   * Update conversation state and context
   */
  async updateConversation(
    conversationId: number,
    state: ConversationState,
    context: ConversationContext
  ) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        state,
        context: JSON.stringify(context),
        lastMessageAt: new Date()
      }
    });
  }

  /**
   * Save message to database
   */
  async saveMessage(
    conversationId: number,
    direction: 'incoming' | 'outgoing',
    content: string,
    messageId?: string,
    extractedData?: ExtractedData
  ) {
    await prisma.message.create({
      data: {
        conversationId,
        direction,
        content,
        messageId,
        extractedData: extractedData ? JSON.stringify(extractedData) : null
      }
    });
  }
}

export const conversationService = new ConversationService();
