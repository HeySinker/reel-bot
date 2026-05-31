/** تشغيل 24/7: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'reel-bot',
      script: 'bot.js',
      cwd: __dirname,
      autorestart: true,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
