const axios = require('axios');
// Aapki jidHelper file ko import kiya
const { normalizeJidWithLid } = require('./jidHelper'); 

module.exports = {
  name: 'pp',
  aliases: ['getpp', 'getpic'],
  category: 'general',
  description: 'Get profile picture of a user',
  usage: '.pp (reply to message or tag user)',
  
  async execute(sock, msg, args, extra) {
    const nl = String.fromCharCode(10);

    try {
      let rawTargetUser = null;
      
      // Extract main message content safely
      const messageContent = msg.message;
      if (!messageContent) return;

      // Deep contextInfo check for replies and tags (handling all message types)
      const contextInfo = messageContent.extendedTextMessage?.contextInfo || 
                          messageContent.imageMessage?.contextInfo || 
                          messageContent.videoMessage?.contextInfo || 
                          messageContent.documentMessage?.contextInfo ||
                          messageContent.buttonsResponseMessage?.contextInfo ||
                          messageContent.templateButtonReplyMessage?.contextInfo;

      if (contextInfo) {
        // 1. Check if it's a reply to someone
        if (contextInfo.participant) {
          rawTargetUser = contextInfo.participant;
        } 
        // 2. Check if anyone is tagged/mentioned
        else if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
          rawTargetUser = contextInfo.mentionedJid[0];
        }
      }

      // 3. Fallback: If no reply or tag, get the sender
      if (!rawTargetUser) {
        // Group mein msg.key.participant hota hai, DM mein direct remoteJid
        rawTargetUser = msg.key.participant || msg.key.remoteJid;
      }

      // 4. CRITICAL FIX: Convert LID or raw string to Clean/Real JID using your helper
      const targetUser = normalizeJidWithLid(rawTargetUser);

      // Final validation to ensure it's a proper whatsapp JID format
      if (!targetUser || !targetUser.includes('@')) {
        return extra.reply('❌ Could not identify target user. Please reply to a message or tag a user.');
      }
      
      try {
        // Fetch profile picture url using the clean/real JID
        const ppUrl = await sock.profilePictureUrl(targetUser, 'image');
        
        if (!ppUrl) {
          return extra.reply('❌ Profile picture not found for this user.');
        }
        
        // Download picture
        const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        // Clean ID for cleaner mention tag text (e.g., 92300xxxxxxx)
        const cleanJid = targetUser.split('@')[0].split(':')[0];
        
        // Send image with proper mention
        await sock.sendMessage(extra.from, { 
          image: buffer,
          caption: `👤 Profile picture of @${cleanJid}`,
          mentions: [targetUser]
        }, { quoted: msg });
        
      } catch (profileError) {
        const errMsg = profileError.message || '';
        const statusCode = profileError.output?.statusCode;

        // Secure handling for Obfuscation & Baileys Privacy Errors
        if (errMsg.includes('item-not-found') || statusCode === 404 || statusCode === 500) {
          return extra.reply('❌ Profile picture not found for this user.');
        } else if (statusCode === 401 || errMsg.includes('forbidden') || errMsg.includes('unauthorized')) {
          return extra.reply('❌ Profile picture not found.' + nl + 'The user\'s profile picture is private.');
        } else {
          return extra.reply('❌ Profile picture not found for this user.');
        }
      }
      
    } catch (error) {
      extra.reply('❌ Profile picture not found for this user.');
    }
  }
};
