/**
 * WhatsApp Config Controller
 * Handles HTTP requests for WhatsApp configuration
 */

import { Request, Response } from 'express';
import { whatsappConfigService } from '../services/config.service';
import { WhatsAppConfigDTO } from '../types';

export class WhatsAppConfigController {
  /**
   * POST /api/whatsapp/config
   * Save or update WhatsApp configuration
   */
  async saveConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const configData: WhatsAppConfigDTO = req.body;

      // Validate required fields
      if (!configData.wabaId || !configData.phoneNumberId || !configData.accessToken || !configData.verifyToken || !configData.companyName) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos'
        });
      }

      const result = await whatsappConfigService.saveConfig(userId, configData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in saveConfig controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/whatsapp/config
   * Get WhatsApp configuration for current user
   */
  async getConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const result = await whatsappConfigService.getConfig(userId);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in getConfig controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * PATCH /api/whatsapp/config/toggle
   * Toggle bot active status
   */
  async toggleActive(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'El campo isActive debe ser un booleano'
        });
      }

      const result = await whatsappConfigService.toggleActive(userId, isActive);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in toggleActive controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * DELETE /api/whatsapp/config
   * Delete WhatsApp configuration
   */
  async deleteConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const result = await whatsappConfigService.deleteConfig(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in deleteConfig controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /api/whatsapp/config/test
   * Test WhatsApp connection
   */
  async testConnection(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const result = await whatsappConfigService.testConnection(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in testConnection controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

export const whatsappConfigController = new WhatsAppConfigController();
