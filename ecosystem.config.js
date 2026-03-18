const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envFile = path.join(__dirname, ".env");
  const env = { NODE_ENV: "production" };

  try {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, "utf8");
      envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            let value = valueParts.join("=");
            value = value.replace(/^["']|["']$/g, "");
            env[key.trim()] = value;
          }
        }
      });
    }
  } catch (error) {
    console.warn("Could not load .env file:", error.message);
  }

  return env;
}

module.exports = {
  apps: [
    {
      name: "vortexbot",
      script: "./dist/main.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: loadEnvFile(),
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
  deploy: {
    production: {
      user: "root",
      host: "185.188.249.171",
      ref: "origin/main",
      repo: "git@github.com:gwang08/VortexBot.git",
      path: "/root/apps/vortexbot",
      "pre-deploy-local": "",
      "post-deploy":
        "source ~/.bashrc && source ~/.nvm/nvm.sh && nvm use node && npm ci && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save",
      "pre-setup": "mkdir -p /root/apps/vortexbot",
      ssh_options: "StrictHostKeyChecking=no",
    },
  },
};
