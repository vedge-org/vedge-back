module.exports = {
  apps: [
    {
      name: 'app',
      // 아래 경로 중 실제 진입점 파일 경로로 수정
      script: './dist/src/index.js', // 또는
      // script: './dist/src/app.js', // 또는
      // script: './dist/server.js',  // 또는
      // script: './dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 80,
      },
    },
  ],
};
