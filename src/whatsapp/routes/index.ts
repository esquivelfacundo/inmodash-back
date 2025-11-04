/**
 * WhatsApp Routes
 * All routes for WhatsApp Bot functionality
 */

import { Router } from 'express';
import { whatsappConfigController } from '../controllers/config.controller';

const router = Router();

// ============================================
// CONFIGURATION ROUTES
// ============================================

// Save/Update WhatsApp configuration
router.post('/config', whatsappConfigController.saveConfig.bind(whatsappConfigController));

// Get WhatsApp configuration
router.get('/config', whatsappConfigController.getConfig.bind(whatsappConfigController));

// Toggle bot active status
router.patch('/config/toggle', whatsappConfigController.toggleActive.bind(whatsappConfigController));

// Delete WhatsApp configuration
router.delete('/config', whatsappConfigController.deleteConfig.bind(whatsappConfigController));

// Test WhatsApp connection
router.post('/config/test', whatsappConfigController.testConnection.bind(whatsappConfigController));

// ============================================
// WEBHOOK ROUTES (will be implemented in Phase 2)
// ============================================

// Webhook verification (GET)
// router.get('/webhook', webhookController.verify);

// Webhook messages (POST)
// router.post('/webhook', webhookController.handleMessage);

export default router;
