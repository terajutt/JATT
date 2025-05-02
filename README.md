# JATT AIRLINES

A responsive cab booking platform designed to streamline ride-hailing experiences with robust user authentication and comprehensive driver management.

## Features

- Phone number login with OTP verification via 2Factor API
- WhatsApp based booking notifications
- Comprehensive driver application and verification system
- Admin dashboard for booking and driver management
- Responsive mobile-first design

## Technologies Used

- **Frontend**: React, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom OTP-based authentication with 2Factor API
- **File Storage**: Local storage with option for cloud storage integration

## Environment Variables

The following environment variables are required:

```
DATABASE_URL=postgresql://your-database-connection-string
TWOFACTOR_API_KEY=your-2factor-api-key
```

## Setup Instructions

### Prerequisites

- Node.js v18+ installed
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Set up environment variables (see above)
4. Run database migrations
   ```
   npm run db:push
   ```
5. Start the development server
   ```
   npm run dev
   ```

## Deployment

For deploying to Render.com, please refer to the `RENDER_DEPLOYMENT_GUIDE.md` file in this repository.

## File Structure

```
├── client/           # Frontend code
├── server/           # Backend code
├── db/               # Database configuration and migrations
├── shared/           # Shared code (schemas, types)
├── uploads/          # Local file storage
└── public/           # Static assets
```

## License

This project is proprietary software owned by JATT AIRLINES.
