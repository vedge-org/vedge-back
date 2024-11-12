module.exports = {
  apps: [
    {
      name: 'app',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 80,
      },
    },
  ],
};
