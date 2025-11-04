/**
 * OpenAI Service
 * Handles natural language processing for WhatsApp bot
 */

import config from '../../config/env';
import { ConversationContext, ConversationState, ExtractedData } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.openaiApiKey;
    if (!this.apiKey) {
      console.warn('⚠️  OpenAI API Key not configured');
    }
  }

  /**
   * Extract information from user message
   */
  async extractInformation(
    message: string,
    currentState: ConversationState,
    context: ConversationContext
  ): Promise<ExtractedData> {
    try {
      const prompt = this.buildExtractionPrompt(message, currentState, context);

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente que extrae información de mensajes de clientes interesados en propiedades inmobiliarias. Responde SOLO con JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error:', error);
        return this.getFallbackExtraction(message, currentState);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return this.getFallbackExtraction(message, currentState);
      }

      // Parse JSON response
      const extracted = JSON.parse(content);
      return {
        name: extracted.name || context.customerName,
        intention: extracted.intention || context.intention,
        propertyType: extracted.propertyType || context.propertyType,
        rooms: extracted.rooms || context.rooms,
        confidence: extracted.confidence || 0.5
      };

    } catch (error) {
      console.error('Error extracting information:', error);
      return this.getFallbackExtraction(message, currentState);
    }
  }

  /**
   * Generate natural response based on context
   */
  async generateResponse(
    extractedData: ExtractedData,
    currentState: ConversationState,
    context: ConversationContext,
    botName: string,
    companyName: string
  ): Promise<string> {
    try {
      const prompt = this.buildResponsePrompt(extractedData, currentState, context, botName, companyName);

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Eres ${botName}, asistente virtual de ${companyName}. Eres amable, profesional y ayudas a clientes a encontrar propiedades. Usa un tono conversacional y cercano.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        return this.getFallbackResponse(currentState, botName);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || this.getFallbackResponse(currentState, botName);

    } catch (error) {
      console.error('Error generating response:', error);
      return this.getFallbackResponse(currentState, botName);
    }
  }

  /**
   * Build prompt for information extraction
   */
  private buildExtractionPrompt(
    message: string,
    currentState: ConversationState,
    context: ConversationContext
  ): string {
    let prompt = `Extrae información del siguiente mensaje de un cliente:\n\n"${message}"\n\n`;

    if (currentState === 'collecting_name') {
      prompt += 'Extrae el NOMBRE del cliente. Puede estar en formatos como "Soy Juan", "Mi nombre es María", "Me llamo Pedro", o simplemente "Carlos".\n';
    } else if (currentState === 'collecting_intention') {
      prompt += 'Extrae la INTENCIÓN (alquilar o comprar) y el TIPO DE PROPIEDAD (departamento, casa, local_comercial, cochera) si se menciona.\n';
    } else if (currentState === 'collecting_property_type') {
      prompt += 'Extrae el TIPO DE PROPIEDAD: departamento, casa, local_comercial, o cochera.\n';
    } else if (currentState === 'collecting_rooms') {
      prompt += 'Extrae la CANTIDAD DE AMBIENTES/DORMITORIOS. Busca números como "2 ambientes", "3 dormitorios", "monoambiente" (=1), etc.\n';
    }

    prompt += '\nResponde SOLO con JSON en este formato:\n';
    prompt += '{\n';
    prompt += '  "name": "nombre extraído o null",\n';
    prompt += '  "intention": "alquilar" o "comprar" o null,\n';
    prompt += '  "propertyType": "departamento" o "casa" o "local_comercial" o "cochera" o null,\n';
    prompt += '  "rooms": número o null,\n';
    prompt += '  "confidence": número entre 0 y 1\n';
    prompt += '}';

    return prompt;
  }

  /**
   * Build prompt for response generation
   */
  private buildResponsePrompt(
    extractedData: ExtractedData,
    currentState: ConversationState,
    context: ConversationContext,
    botName: string,
    companyName: string
  ): string {
    let prompt = `Genera una respuesta natural y amigable para el cliente.\n\n`;
    prompt += `Contexto:\n`;
    prompt += `- Bot: ${botName} de ${companyName}\n`;
    prompt += `- Estado actual: ${currentState}\n`;
    prompt += `- Información del cliente: ${JSON.stringify(context)}\n`;
    prompt += `- Datos extraídos: ${JSON.stringify(extractedData)}\n\n`;

    if (currentState === 'collecting_name') {
      prompt += `El cliente acaba de dar su nombre. Salúdalo por su nombre y pregúntale si está buscando alquilar o comprar una propiedad.`;
    } else if (currentState === 'collecting_property_type') {
      prompt += `Pregúntale qué tipo de propiedad está buscando: departamento, casa, local comercial o cochera.`;
    } else if (currentState === 'collecting_rooms') {
      prompt += `Pregúntale de cuántos ambientes o dormitorios está buscando la propiedad.`;
    }

    prompt += `\n\nGenera SOLO el mensaje de respuesta, sin explicaciones adicionales. Máximo 2-3 líneas.`;

    return prompt;
  }

  /**
   * Fallback extraction when OpenAI fails
   */
  private getFallbackExtraction(message: string, currentState: ConversationState): ExtractedData {
    const extracted: ExtractedData = {
      confidence: 0.3
    };

    const lowerMessage = message.toLowerCase();

    // Extract name
    if (currentState === 'collecting_name') {
      const namePatterns = [
        /(?:soy|me llamo|mi nombre es)\s+([a-záéíóúñ]+)/i,
        /^([a-záéíóúñ]+)$/i
      ];

      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match) {
          extracted.name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          break;
        }
      }
    }

    // Extract intention
    if (lowerMessage.includes('alquilar') || lowerMessage.includes('alquiler')) {
      extracted.intention = 'alquilar';
    } else if (lowerMessage.includes('comprar') || lowerMessage.includes('compra')) {
      extracted.intention = 'comprar';
    }

    // Extract property type
    if (lowerMessage.includes('departamento') || lowerMessage.includes('depto')) {
      extracted.propertyType = 'departamento';
    } else if (lowerMessage.includes('casa')) {
      extracted.propertyType = 'casa';
    } else if (lowerMessage.includes('local') || lowerMessage.includes('comercial')) {
      extracted.propertyType = 'local_comercial';
    } else if (lowerMessage.includes('cochera') || lowerMessage.includes('garage')) {
      extracted.propertyType = 'cochera';
    }

    // Extract rooms
    const roomsMatch = message.match(/(\d+)\s*(?:ambientes?|dormitorios?|habitaciones?)/i);
    if (roomsMatch) {
      extracted.rooms = parseInt(roomsMatch[1]);
    } else if (lowerMessage.includes('monoambiente')) {
      extracted.rooms = 1;
    }

    return extracted;
  }

  /**
   * Fallback response when OpenAI fails
   */
  private getFallbackResponse(currentState: ConversationState, botName: string): string {
    const responses: Record<ConversationState, string> = {
      initial: `¡Hola! Soy ${botName}, ¿cómo es tu nombre?`,
      collecting_name: '¿Cómo es tu nombre?',
      collecting_intention: '¿Estás buscando alquilar o comprar una propiedad?',
      collecting_property_type: '¿Qué tipo de propiedad estás buscando? (departamento, casa, local comercial o cochera)',
      collecting_rooms: '¿De cuántos ambientes o dormitorios estás buscando?',
      showing_properties: 'Déjame buscar las propiedades disponibles...',
      awaiting_selection: '¿Cuál de estas propiedades te interesa?',
      completed: '¡Gracias por tu interés! Un asesor se pondrá en contacto contigo pronto.'
    };

    return responses[currentState] || '¿En qué puedo ayudarte?';
  }
}

export const openaiService = new OpenAIService();
