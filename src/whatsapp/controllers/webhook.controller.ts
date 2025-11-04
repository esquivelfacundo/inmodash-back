/**
 * WhatsApp Webhook Controller
 * Handles incoming webhooks from Meta WhatsApp API
 */

import { Request, Response } from 'express';
import { whatsappConfigService } from '../services/config.service';
import { conversationService } from '../services/conversation.service';
import { whatsappService } from '../services/whatsapp.service';
import { WhatsAppWebhookPayload, ConversationContext } from '../types';

export class WhatsAppWebhookController {
  /**
   * GET /api/whatsapp/webhook
   * Webhook verification endpoint
   */
  async verify(req: Request, res: Response) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('📞 Webhook verification request:', { mode, token: token ? '***' : 'missing' });

      if (mode === 'subscribe') {
        // Find config with this verify token
        const configs = await this.getAllConfigs();
        const matchingConfig = configs.find(c => c.verifyToken === token);

        if (matchingConfig) {
          console.log('✅ Webhook verified successfully for user:', matchingConfig.userId);
          return res.status(200).send(challenge);
        } else {
          console.log('❌ Webhook verification failed: Invalid verify token');
          return res.status(403).send('Forbidden');
        }
      }

      return res.status(400).send('Bad Request');
    } catch (error: any) {
      console.error('Error in webhook verification:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  /**
   * POST /api/whatsapp/webhook
   * Handle incoming messages
   */
  async handleMessage(req: Request, res: Response) {
    try {
      const payload: WhatsAppWebhookPayload = req.body;

      console.log('📨 Received webhook:', JSON.stringify(payload, null, 2));

      // Respond immediately to Meta
      res.status(200).send('OK');

      // Process webhook asynchronously
      this.processWebhook(payload).catch(error => {
        console.error('Error processing webhook:', error);
      });

    } catch (error: any) {
      console.error('Error handling webhook:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Process webhook payload asynchronously
   */
  private async processWebhook(payload: WhatsAppWebhookPayload) {
    try {
      // Extract message data
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const { value } = change;

          // Skip if no messages
          if (!value.messages || value.messages.length === 0) {
            continue;
          }

          const phoneNumberId = value.metadata.phone_number_id;

          // Get config for this phone number
          const config = await whatsappConfigService.getConfigByPhoneNumberId(phoneNumberId);

          if (!config || !config.isActive) {
            console.log('⚠️  Bot not active or config not found for phone number:', phoneNumberId);
            continue;
          }

          // Process each message
          for (const message of value.messages) {
            await this.processIncomingMessage(message, config as any);
          }
        }
      }
    } catch (error) {
      console.error('Error in processWebhook:', error);
    }
  }

  /**
   * Process individual incoming message
   */
  private async processIncomingMessage(message: any, config: any) {
    try {
      const from = message.from;
      const messageText = message.text?.body;
      const messageId = message.id;

      if (!messageText) {
        console.log('⚠️  Received non-text message, skipping');
        return;
      }

      console.log(`💬 Processing message from ${from}: "${messageText}"`);

      // Get or create conversation
      const conversation = await conversationService.getOrCreateConversation(config.id, from);

      // Parse context
      let context: ConversationContext = {};
      try {
        context = JSON.parse(conversation.context);
      } catch (e) {
        context = {};
      }

      // Save incoming message
      await conversationService.saveMessage(
        conversation.id,
        'incoming',
        messageText,
        messageId
      );

      // Handle initial greeting
      if (conversation.state === 'initial') {
        const greetingMessage = whatsappService.formatGreetingMessage(
          config.botName,
          config.companyName
        );

        await whatsappService.sendMessage(
          config.phoneNumberId,
          config.accessToken,
          from,
          greetingMessage
        );

        await conversationService.saveMessage(
          conversation.id,
          'outgoing',
          greetingMessage
        );

        await conversationService.updateConversation(
          conversation.id,
          'collecting_name',
          context
        );

        return;
      }

      // Process message and get response
      const result = await conversationService.processMessage(
        conversation.id,
        messageText,
        conversation.state as any,
        context,
        config.botName,
        config.companyName,
        config.user?.companyPhone || ''
      );

      // Send response
      await whatsappService.sendMessage(
        config.phoneNumberId,
        config.accessToken,
        from,
        result.response
      );

      // Save outgoing message
      await conversationService.saveMessage(
        conversation.id,
        'outgoing',
        result.response
      );

      // Update conversation state
      await conversationService.updateConversation(
        conversation.id,
        result.nextState,
        result.updatedContext
      );

      console.log(`✅ Message processed successfully. Next state: ${result.nextState}`);

    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  /**
   * Helper to get all configs (for verification)
   */
  private async getAllConfigs() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const configs = await prisma.whatsAppConfig.findMany({
        select: {
          userId: true,
          verifyToken: true
        }
      });
      return configs;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export const webhookController = new WhatsAppWebhookController();
