module.exports = {
  apps: [{
    name: 'lemi-wiki',
    script: '.output/server/index.mjs',
    cwd: '/var/www/lemi/lemi-wiki',
    instances: 1,
    autorestart: false,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      HOST: '127.0.0.1'
    }
  }]
}
