module.exports = {
  apps: [
    {
      name: 'korean-talim-backend',
      cwd: '/var/www/korean-talim-ai/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
    {
      name: 'korean-talim-frontend',
      cwd: '/var/www/korean-talim-ai/frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
    },
  ],
};
