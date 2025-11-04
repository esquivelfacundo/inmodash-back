# 🔍 DEBUG WHATSAPP BOT

## CHECKLIST DE VERIFICACIÓN:

### 1. ✅ VERIFICAR BOT ACTIVO
- [ ] Ve a: https://www.inmodash.com.ar/settings/whatsapp
- [ ] El switch "Bot Activo" está en ON (verde)
- [ ] Las credenciales están guardadas

### 2. ✅ VERIFICAR WEBHOOK EN META
- [ ] Ve a: https://developers.facebook.com/apps
- [ ] WhatsApp → Configuration → Webhook
- [ ] URL configurada: https://inmodash-back-production.up.railway.app/api/whatsapp/webhook
- [ ] Campo "messages" está suscrito (✓)

### 3. ✅ VERIFICAR LOGS EN RAILWAY
Ve a: Railway → inmodash-back → Deployments → View Logs

**Busca estos mensajes:**
```
📞 Webhook verification request
📨 Received webhook
💬 Processing message from
✅ Message processed successfully
```

**Si ves errores, busca:**
```
❌ Error
⚠️  Warning
```

### 4. ✅ VERIFICAR VARIABLE DE ENTORNO
Railway → Variables → Verifica que existe:
```
OPENAI_API_KEY = sk-proj-...
```

### 5. ✅ TEST MANUAL DEL WEBHOOK

**Verificación (debe responder "test123"):**
```bash
curl "https://inmodash-back-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TU_VERIFY_TOKEN&hub.challenge=test123"
```

**Enviar mensaje de prueba (simular Meta):**
```bash
curl -X POST https://inmodash-back-production.up.railway.app/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "PHONE_NUMBER",
            "phone_number_id": "TU_PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": {
              "name": "Test User"
            },
            "wa_id": "5491112345678"
          }],
          "messages": [{
            "from": "5491112345678",
            "id": "wamid.test123",
            "timestamp": "1234567890",
            "text": {
              "body": "Hola"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

## PROBLEMAS COMUNES:

### ❌ Bot no responde
**Causas posibles:**
1. Bot no está activo en el dashboard
2. Webhook no está configurado en Meta
3. Phone Number ID incorrecto
4. Access Token inválido o expirado
5. OPENAI_API_KEY no configurada

**Solución:**
- Verifica cada punto del checklist
- Revisa logs de Railway
- Prueba desactivar y reactivar el bot

### ❌ Error "Forbidden" en webhook
**Causa:** Verify Token incorrecto

**Solución:**
- Usa el mismo verify token en Meta y en el dashboard
- Debe ser exactamente igual (case-sensitive)

### ❌ Error "Bot not active"
**Causa:** Bot desactivado o config no encontrada

**Solución:**
- Activa el bot desde el dashboard
- Verifica que las credenciales estén guardadas

### ❌ Error de OpenAI
**Causa:** API Key no configurada o inválida

**Solución:**
- Verifica la variable OPENAI_API_KEY en Railway
- Redeploy después de agregar la variable

## COMANDOS ÚTILES:

### Ver estado de la base de datos:
```sql
-- Verificar configuración de WhatsApp
SELECT id, "userId", "isActive", "phoneNumberId", "botName" 
FROM "WhatsAppConfig";

-- Ver conversaciones activas
SELECT id, "phoneNumber", state, "lastMessageAt" 
FROM "Conversation" 
ORDER BY "lastMessageAt" DESC 
LIMIT 10;

-- Ver últimos mensajes
SELECT m.id, m.direction, m.content, m."createdAt", c."phoneNumber"
FROM "Message" m
JOIN "Conversation" c ON m."conversationId" = c.id
ORDER BY m."createdAt" DESC
LIMIT 20;
```

### Verificar que las tablas existen:
```bash
curl https://inmodash-back-production.up.railway.app/api/whatsapp/config/check \
  -H "Authorization: Bearer TU_JWT_TOKEN"
```

## INFORMACIÓN DE CONTACTO:

Si nada funciona, revisa:
1. Logs de Railway (más importante)
2. Consola de Meta for Developers
3. Dashboard de WhatsApp Business

## PRÓXIMOS PASOS SI TODO FALLA:

1. Desactiva el bot
2. Elimina la configuración
3. Vuelve a configurar desde cero
4. Verifica que Meta haya aprobado tu número de WhatsApp Business
