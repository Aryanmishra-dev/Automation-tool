module.exports = {
  apps: [
    {
      name: 'social-bot-api',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '../../data/logs/pm2-error.log',
      out_file: '../../data/logs/pm2-out.log',
      log_file: '../../data/logs/pm2-combined.log',
      time: true,
    },
    {
      name: 'social-bot-worker',
      script: './dist/jobs/worker-process.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '../../data/logs/pm2-worker-error.log',
      out_file: '../../data/logs/pm2-worker-out.log',
      time: true,
    },
  ],
};
