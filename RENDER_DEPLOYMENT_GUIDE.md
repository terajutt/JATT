# Deployment Guide for JATT AIRLINES on Render

This guide will help you deploy the JATT AIRLINES application on Render.com.

## Prerequisites

1. A Render.com account
2. Access to your Neon PostgreSQL database
3. Your 2Factor API key for OTP verification

## Deployment Steps

### 1. Prepare Your Repository

Make sure your code is in a Git repository (GitHub, GitLab, etc.) that Render can access.

### 2. Configure for Render

Create a file named `render.yaml` at the root of your project with the following content:

```yaml
services:
  - type: web
    name: jatt-airlines
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false # You'll need to manually enter this
      - key: TWOFACTOR_API_KEY
        sync: false # You'll need to manually enter this
```

### 3. Create a Production Start Script

Ensure your package.json has a "start" script that can run the application in production mode. Add this to your package.json:

```json
"scripts": {
  "start": "node dist/server/index.js",
  "build": "vite build && tsc --project tsconfig.json --outDir dist"
}
```

### 4. Set Up Render Web Service

1. Log in to Render.com
2. Click "New +" and select "Web Service"
3. Connect your repository
4. Use the following settings:
   - Name: jatt-airlines
   - Environment: Node.js
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### 5. Configure Environment Variables

In the Render dashboard for your service, go to "Environment" and add the following environment variables:

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `TWOFACTOR_API_KEY`: Your 2Factor API key
- `NODE_ENV`: production

### 6. Deploy

Click "Create Web Service" and Render will begin deploying your application.

### 7. Set Up Uploads Directory

This application uses a service for file storage (referenced in the code as `https://storage.jattairlines.com/`). You will need to:

1. Create that storage service or update the image URLs in your database to point to a valid storage location
2. Ensure the `uploads` directory is properly configured on your production server

### 8. Database Setup

Make sure your database is fully set up:

```bash
# These commands should be run before deployment to ensure your DB is ready
npm run db:push  # To update the schema
npm run db:seed  # To seed initial data if needed
```

## Important Notes

1. This application uses OTP verification through 2Factor API. Make sure your TWOFACTOR_API_KEY is valid.
2. Ensure your Neon PostgreSQL database is accessible from Render's servers.
3. The uploads directory needs to be properly configured for driver document uploads to work.
4. WhatsApp integration for sending booking details to admin should be tested after deployment.

## Troubleshooting

- If you encounter database connection issues, ensure your DATABASE_URL is correct and that your database allows connections from Render's IP addresses.
- If file uploads aren't working, check the file storage configuration in `server/storage.ts`.
- For OTP issues, verify your TWOFACTOR_API_KEY is correctly set up in the environment variables.
