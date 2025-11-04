/**
 * WhatsApp Service
 * Handles sending messages through WhatsApp Business API
 */

import { WhatsAppSendMessageResponse, PropertyResult } from '../types';

export class WhatsAppService {
  /**
   * Send text message to WhatsApp user
   */
  async sendMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string
  ): Promise<WhatsAppSendMessageResponse | null> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
              body: message
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('WhatsApp API error:', error);
        return null;
      }

      return (await response.json()) as WhatsAppSendMessageResponse;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return null;
    }
  }

  /**
   * Format property information for WhatsApp message
   */
  formatPropertyMessage(property: PropertyResult, index: number): string {
    let message = `🏠 *Propiedad ${index}*\n\n`;

    // Property type
    const typeLabels: Record<string, string> = {
      departamento: '🏢 Departamento',
      casa: '🏡 Casa',
      local_comercial: '🏪 Local Comercial',
      cochera: '🚗 Cochera'
    };
    message += `${typeLabels[property.propertyType] || property.propertyType}\n`;

    // Location
    if (property.buildingName) {
      message += `📍 ${property.buildingName}\n`;
      if (property.floor && property.apartmentLetter) {
        message += `   Piso ${property.floor} - ${property.apartmentLetter}\n`;
      }
    } else if (property.address) {
      message += `📍 ${property.address}, ${property.city}\n`;
    }

    // Details
    if (property.rooms > 0) {
      message += `🛏️ ${property.rooms} ${property.rooms === 1 ? 'ambiente' : 'ambientes'}\n`;
    }

    if (property.area > 0) {
      message += `📐 ${property.area}m²\n`;
    }

    // Price
    if (property.rentalPrice) {
      message += `💰 $${property.rentalPrice.toLocaleString('es-AR')}/mes\n`;
    }

    message += `\n`;

    return message;
  }

  /**
   * Format list of properties with selection options
   */
  formatPropertiesListMessage(properties: PropertyResult[]): string {
    let message = `Encontré ${properties.length} ${properties.length === 1 ? 'propiedad' : 'propiedades'} disponible${properties.length === 1 ? '' : 's'}:\n\n`;

    properties.forEach((property, index) => {
      const num = index + 1;
      message += `*${num}.* `;

      if (property.buildingName) {
        message += `${property.buildingName}`;
        if (property.floor && property.apartmentLetter) {
          message += ` - Piso ${property.floor}${property.apartmentLetter}`;
        }
      } else {
        message += `${property.nomenclature}`;
      }

      if (property.rooms > 0) {
        message += ` (${property.rooms} amb)`;
      }

      if (property.rentalPrice) {
        message += ` - $${property.rentalPrice.toLocaleString('es-AR')}`;
      }

      message += `\n`;
    });

    message += `\n¿Cuál te interesa? Responde con el número (1, 2, 3, etc.)`;

    return message;
  }

  /**
   * Format contact message with company phone
   */
  formatContactMessage(companyPhone: string): string {
    return `Para más información, contactate con nosotros al ${companyPhone} 📞`;
  }

  /**
   * Format greeting message
   */
  formatGreetingMessage(botName: string, companyName: string): string {
    return `¡Hola! Soy *${botName}* de *${companyName}* 👋\n\n¿Cómo es tu nombre?`;
  }

  /**
   * Format no properties found message
   */
  formatNoPropertiesMessage(companyPhone: string): string {
    return `Lo siento, no encontré propiedades disponibles con esas características en este momento. 😔\n\nPara más opciones, contactate con nosotros al ${companyPhone} 📞`;
  }
}

export const whatsappService = new WhatsAppService();
