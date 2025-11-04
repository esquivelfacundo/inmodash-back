/**
 * WhatsApp Routes
 * All routes for WhatsApp Bot functionality
 */

import { Router } from 'express';
import { whatsappConfigController } from '../controllers/config.controller';
import { webhookController } from '../controllers/webhook.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// ============================================
// CONFIGURATION ROUTES (require authentication)
// ============================================

// Check if tables exist (diagnostic)
router.get('/config/check', authenticate, whatsappConfigController.checkTables.bind(whatsappConfigController));

// Save/Update WhatsApp configuration
router.post('/config', authenticate, whatsappConfigController.saveConfig.bind(whatsappConfigController));

// Get WhatsApp configuration
router.get('/config', authenticate, whatsappConfigController.getConfig.bind(whatsappConfigController));

// Toggle bot active status
router.patch('/config/toggle', authenticate, whatsappConfigController.toggleActive.bind(whatsappConfigController));

// Delete WhatsApp configuration
router.delete('/config', authenticate, whatsappConfigController.deleteConfig.bind(whatsappConfigController));

// Test WhatsApp connection
router.post('/config/test', authenticate, whatsappConfigController.testConnection.bind(whatsappConfigController));

// ============================================
// WEBHOOK ROUTES
// ============================================

// Webhook verification (GET) - No authentication required
router.get('/webhook', webhookController.verify.bind(webhookController));

// Webhook messages (POST) - No authentication required (Meta will send here)
router.post('/webhook', webhookController.handleMessage.bind(webhookController));

export default router;
