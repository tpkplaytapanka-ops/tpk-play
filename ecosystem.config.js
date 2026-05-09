module.exports = {
  apps: [{
    name: 'tpk-play',
    script: 'node',
    args: 'server.js',
    cwd: '/var/www/tpk-play',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    error_file: '/var/log/tpk-play/error.log',
    out_file: '/var/log/tpk-play/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
