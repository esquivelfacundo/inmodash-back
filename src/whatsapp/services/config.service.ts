/**
 * WhatsApp Config Service
 * Handles WhatsApp configuration CRUD operations
 */

import { PrismaClient } from '@prisma/client';
import { WhatsAppConfigDTO, WhatsAppConfigResponse, ApiResponse } from '../types';

const prisma = new PrismaClient();

export class WhatsAppConfigService {
  /**
   * Create or update WhatsApp configuration for a user
   */
  async saveConfig(userId: number, configData: WhatsAppConfigDTO): Promise<ApiResponse<WhatsAppConfigResponse>> {
    try {
      // Check if config already exists
      const existingConfig = await prisma.whatsAppConfig.findUnique({
        where: { userId }
      });

      let config;

      if (existingConfig) {
        // Update existing config
        config = await prisma.whatsAppConfig.update({
          where: { userId },
          data: {
            wabaId: configData.wabaId,
            phoneNumberId: configData.phoneNumberId,
            accessToken: configData.accessToken,
            verifyToken: configData.verifyToken,
            botName: configData.botName || 'Martina',
            companyName: configData.companyName,
            isActive: configData.isActive ?? existingConfig.isActive,
          }
        });
      } else {
        // Create new config
        config = await prisma.whatsAppConfig.create({
          data: {
            userId,
            wabaId: configData.wabaId,
            phoneNumberId: configData.phoneNumberId,
            accessToken: configData.accessToken,
            verifyToken: configData.verifyToken,
            botName: configData.botName || 'Martina',
            companyName: configData.companyName,
            isActive: configData.isActive ?? false,
          }
        });
      }

      return {
        success: true,
        data: config as WhatsAppConfigResponse,
        message: existingConfig ? 'Configuración actualizada exitosamente' : 'Configuración creada exitosamente'
      };
    } catch (error: any) {
      console.error('Error saving WhatsApp config:', error);
      return {
        success: false,
        error: error.message || 'Error al guardar la configuración'
      };
    }
  }

  /**
   * Get WhatsApp configuration for a user
   */
  async getConfig(userId: number): Promise<ApiResponse<WhatsAppConfigResponse | null>> {
    try {
      const config = await prisma.whatsAppConfig.findUnique({
        where: { userId }
      });

      if (!config) {
        return {
          success: true,
          data: null,
          message: 'No hay configuración de WhatsApp para este usuario'
        };
      }

      // Don't expose the full access token in responses
      const safeConfig = {
        ...config,
        accessToken: config.accessToken.substring(0, 20) + '...' // Only show first 20 chars
      } as WhatsAppConfigResponse;

      return {
        success: true,
        data: safeConfig
      };
    } catch (error: any) {
      console.error('Error getting WhatsApp config:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener la configuración'
      };
    }
  }

  /**
   * Get full config (including access token) - for internal use only
   */
  async getFullConfig(userId: number): Promise<WhatsAppConfigResponse | null> {
    try {
      const config = await prisma.whatsAppConfig.findUnique({
        where: { userId }
      });

      return config as WhatsAppConfigResponse | null;
    } catch (error) {
      console.error('Error getting full WhatsApp config:', error);
      return null;
    }
  }

  /**
   * Get config by phone number ID (for webhook processing)
   */
  async getConfigByPhoneNumberId(phoneNumberId: string): Promise<WhatsAppConfigResponse | null> {
    try {
      const config = await prisma.whatsAppConfig.findUnique({
        where: { phoneNumberId },
        include: {
          user: {
            select: {
              id: true,
              companyName: true,
              companyPhone: true
            }
          }
        }
      });

      return config as any;
    } catch (error) {
      console.error('Error getting config by phone number ID:', error);
      return null;
    }
  }

  /**
   * Toggle bot active status
   */
  async toggleActive(userId: number, isActive: boolean): Promise<ApiResponse<WhatsAppConfigResponse>> {
    try {
      const config = await prisma.whatsAppConfig.update({
        where: { userId },
        data: { isActive }
      });

      return {
        success: true,
        data: config as WhatsAppConfigResponse,
        message: `Bot ${isActive ? 'activado' : 'desactivado'} exitosamente`
      };
    } catch (error: any) {
      console.error('Error toggling bot status:', error);
      return {
        success: false,
        error: error.message || 'Error al cambiar el estado del bot'
      };
    }
  }

  /**
   * Delete WhatsApp configuration
   */
  async deleteConfig(userId: number): Promise<ApiResponse<void>> {
    try {
      await prisma.whatsAppConfig.delete({
        where: { userId }
      });

      return {
        success: true,
        message: 'Configuración eliminada exitosamente'
      };
    } catch (error: any) {
      console.error('Error deleting WhatsApp config:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la configuración'
      };
    }
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(userId: number): Promise<ApiResponse<boolean>> {
    try {
      const config = await this.getFullConfig(userId);

      if (!config) {
        return {
          success: false,
          error: 'No hay configuración de WhatsApp'
        };
      }

      // Test connection to Meta API
      const fullConfig = await prisma.whatsAppConfig.findUnique({
        where: { userId }
      });

      if (!fullConfig) {
        return {
          success: false,
          error: 'No se encontró la configuración'
        };
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${fullConfig.phoneNumberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${fullConfig.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as any;
        return {
          success: false,
          error: errorData.error?.message || 'Error al conectar con WhatsApp API'
        };
      }

      return {
        success: true,
        data: true,
        message: 'Conexión exitosa con WhatsApp API'
      };
    } catch (error: any) {
      console.error('Error testing WhatsApp connection:', error);
      return {
        success: false,
        error: error.message || 'Error al probar la conexión'
      };
    }
  }
}

export const whatsappConfigService = new WhatsAppConfigService();
