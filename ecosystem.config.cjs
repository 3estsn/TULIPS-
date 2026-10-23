/**
 * ConoHa VPS PM2 プロセス管理設定ファイル
 * 
 * 使用方法 (ConoHa サーバー上):
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'tulips-app',
      script: 'node_modules/.bin/tsx',
      args: 'server.ts',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        CONOHA_SERVER_HOST: '0.0.0.0',
        DATA_DIR: './data',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
  ],
};
