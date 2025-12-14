module.exports = {
  apps: [
    {
      name: 'auth-backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      out_file: '/var/log/auth-backend/out.log',
      error_file: '/var/log/auth-backend/error.log',
      merge_logs: true,
      kill_timeout: 30000
    }
  ]
};
