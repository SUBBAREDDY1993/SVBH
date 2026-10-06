const { spawn } = require('child_process');

if (process.platform === 'win32') {
  // On Windows: Launch local development environment (Spring Boot + Vite)
  const child = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', './start-dev.ps1'], {
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  // On Linux / Render: Serve built frontend single-page app
  const port = process.env.PORT || '10000';
  const child = spawn('npx', ['serve', '-s', 'frontend/dist', '-l', port], {
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code || 0));
}
