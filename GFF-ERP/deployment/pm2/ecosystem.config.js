/**
 * GFF ERP Enterprise - PM2 Ecosystem Configuration
 * =================================================
 * Description: Production process management for GFF ERP backend
 * Version: 1.0
 * PM2 Version: 5.x+
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 reload ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 delete ecosystem.config.js
 *   pm2 logs gff-erp-backend
 *   pm2 monit
 */

module.exports = {
  /**
   * Application Definitions
   */
  apps: [
    {
      // Application name (used for logs, monitoring)
      name: 'gff-erp-backend',

      // Entry point script
      script: './dist/main.js',

      // Working directory
      cwd: '/opt/gff-erp/backend',

      /**
       * Cluster Configuration
       */
      // Number of instances - 'max' uses all CPU cores
      // For dedicated servers: use 'max'
      // For shared servers: specify a number (e.g., 2, 4)
      instances: 'max',

      // Execution mode: 'cluster' for load balancing, 'fork' for single instance
      exec_mode: 'cluster',

      // Instance variable for cluster mode (distinguishes instances)
      instance_var: 'INSTANCE_ID',

      /**
       * Environment Variables
       */
      // Production environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '127.0.0.1',
      },

      // Staging environment (override with: pm2 start --env staging)
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        HOST: '127.0.0.1',
      },

      // Development environment (override with: pm2 start --env development)
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '127.0.0.1',
      },

      /**
       * Process Management
       */
      // Auto-restart on crash
      autorestart: true,

      // Minimum uptime before restart is considered a crash (ms)
      min_uptime: '10s',

      // Maximum number of restarts within 60 seconds
      max_restarts: 5,

      // Delay between restarts (ms)
      restart_delay: 3000,

      // Maximum memory before restart
      max_memory_restart: '1G',

      // Number of CPU cores to use (when instances is a number)
      // cpu_affinity: true,

      /**
       * Process Behavior
       */
      // Kill timeout (ms) - time to wait for graceful shutdown
      kill_timeout: 5000,

      // Listen timeout (ms) - time to wait for app to be ready
      listen_timeout: 10000,

      // Shutdown with message (graceful shutdown)
      shutdown_with_message: true,

      // Wait for readiness signal before considering app ready
      wait_ready: true,

      // Send SIGKILL if graceful shutdown fails
      force: true,

      /**
       * File Watching (DISABLED in production)
       */
      // Watch for file changes (DO NOT enable in production)
      watch: false,

      // Files/directories to ignore when watching
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        'prisma/migrations',
        '*.log',
        '*.md',
      ],

      // Watch options
      watch_options: {
        followSymlinks: false,
      },

      /**
       * Logging Configuration
       */
      // Combined log file (stdout + stderr)
      log_file: '/var/log/gff-erp/pm2/combined.log',

      // Out log file (stdout only)
      out_file: '/var/log/gff-erp/pm2/out.log',

      // Error log file (stderr only)
      error_file: '/var/log/gff-erp/pm2/error.log',

      // Log date format
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs from all instances into single file
      merge_logs: true,

      // Disable logging for specific instances
      disable_logs: false,

      // Log type: json or raw
      log_type: 'json',

      /**
       * Monitoring
       */
      // Enable PM2 monitoring
      monitor: true,

      /**
       * Source Map Support
       */
      // Enable source map support for stack traces
      source_map_support: false,

      /**
       * Interpreter
       */
      // Node.js interpreter
      exec_interpreter: 'node',

      // Arguments passed to Node.js
      node_args: [
        '--max-old-space-size=1024',  // 1GB heap size
        // '--expose-gc',              // Enable manual GC (optional)
      ],

      /**
       * Advanced
       */
      // Write pid file
      pid_file: '/var/log/gff-erp/pm2/gff-erp-backend.pid',

      // Tree kill (kill child processes)
      treekill: true,

      // Increment port for each instance (when using multiple ports)
      // increment_var: 'PORT',
    },
  ],

  /**
   * Deployment Configuration (optional - for remote deployment)
   */
  deploy: {
    production: {
      // SSH user
      user: 'gff-erp',

      // Server host
      host: ['erp.yourdomain.com'],

      // SSH key
      key: '~/.ssh/id_rsa',

      // SSH port
      ssh_port: 22,

      // Ref to deploy
      ref: 'origin/main',

      // Git repository
      repo: 'git@github.com:your-org/gff-erp.git',

      // Path on server
      path: '/opt/gff-erp',

      // Pre-deploy: local commands
      'pre-deploy-local': '',

      // Post-deploy: remote commands
      'post-deploy': 'cd backend && npm ci --production && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',

      // Pre-setup: remote commands before first deploy
      'pre-setup': '',

      // Post-setup: remote commands after first deploy
      'post-setup': 'cd backend && npm install',

      // Environment variables for deployment
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'gff-erp',
      host: ['staging.erp.yourdomain.com'],
      key: '~/.ssh/id_rsa',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/gff-erp.git',
      path: '/opt/gff-erp-staging',
      'post-deploy': 'cd backend && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
