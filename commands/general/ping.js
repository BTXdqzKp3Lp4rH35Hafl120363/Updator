const os = require('os');
const config = require('../../config');

module.exports = {
  name: 'ping',
  aliases: ['p'],
  category: 'general',
  description: 'Check bot latency and system performance',
  usage: '.ping',

  async execute(sock, msg, args, extra) {
    try {
      const start = Date.now();
      await sock.fetchStatus(extra.from);
      const messageLatency = Date.now() - start;

      const totalMem = os.totalmem() / 1024 / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024 / 1024;
      const usedMem = totalMem - freeMem;

      const response = `⚡ *ᴍᴇꜱꜱᴀɢᴇ ʟᴀᴛᴇɴᴄʏ:* ${messageLatency} ms\n🧠 *ʀᴀᴍ ᴜꜱᴀɢᴇ:* ${usedMem.toFixed(2)}GB / ${totalMem.toFixed(2)}GB\n🧬 *ᴠᴇʀꜱɪᴏɴ:* ${config.version}`;

      await sock.sendMessage(extra.from, { text: response.trim() }, { quoted: msg });
    } catch (error) {
      await extra.reply(`❌ *Ping Failed!*\n${error.message}`);
    }
  }
};
