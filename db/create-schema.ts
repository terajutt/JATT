import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';
import * as schema from '../shared/schema';
import path from 'path';

async function main() {
  try {
    const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pvax71cAMrUF@ep-withered-butterfly-a4vod37p-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
    
    console.log('Creating database schema...');
    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });

    // Create tables directly without migrations
    await createTables(pool);
    
    console.log('Schema created successfully!');
  } catch (error) {
    console.error('Error creating schema:', error);
  }
}

async function createTables(pool: Pool) {
  // Execute SQL statements to create tables directly
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone_number TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  const createDriversTable = `
    CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      full_name TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      vehicle_model TEXT,
      vehicle_number TEXT NOT NULL,
      license_url TEXT,
      id_proof_url TEXT,
      selfie_url TEXT,
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  const createBookingsTable = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      driver_id INTEGER REFERENCES drivers(id),
      pickup_location TEXT NOT NULL,
      drop_location TEXT NOT NULL,
      date TEXT NOT NULL,
      passengers INTEGER NOT NULL DEFAULT 1,
      ride_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      estimated_fare DECIMAL(10, 2),
      luggage BOOLEAN NOT NULL DEFAULT FALSE,
      kids BOOLEAN NOT NULL DEFAULT FALSE,
      elder_passenger BOOLEAN NOT NULL DEFAULT FALSE,
      pets BOOLEAN NOT NULL DEFAULT FALSE,
      special_requests TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  const createTestimonialsTable = `
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      avatar_url TEXT,
      is_visible BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  const createOtpsTable = `
    CREATE TABLE IF NOT EXISTS otps (
      id SERIAL PRIMARY KEY,
      phone_number TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  const createEarningsTable = `
    CREATE TABLE IF NOT EXISTS earnings (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER NOT NULL REFERENCES drivers(id),
      booking_id INTEGER NOT NULL REFERENCES bookings(id),
      amount DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createUsersTable);
    console.log('Users table created or already exists');
    
    await pool.query(createDriversTable);
    console.log('Drivers table created or already exists');
    
    await pool.query(createBookingsTable);
    console.log('Bookings table created or already exists');
    
    await pool.query(createTestimonialsTable);
    console.log('Testimonials table created or already exists');
    
    await pool.query(createOtpsTable);
    console.log('OTPs table created or already exists');
    
    await pool.query(createEarningsTable);
    console.log('Earnings table created or already exists');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Execute the main function
main();
