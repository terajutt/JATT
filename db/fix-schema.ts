import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

// Configure WebSocket constructor for Neon - DO NOT change this
neonConfig.webSocketConstructor = ws;

async function fixSchema() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pvax71cAMrUF@ep-withered-butterfly-a4vod37p-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
  const pool = new Pool({ connectionString });

  try {
    // Fix the users, drivers and other tables as needed
    console.log('Updating database schema to fix column issues...');

    // Check if testimonials is missing proper columns
    await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'testimonials' 
        AND column_name = 'is_visible'
      );
    `).then(async (result) => {
      if (!result.rows[0].exists) {
        console.log('Re-creating testimonials table with proper schema...');
        await pool.query('DROP TABLE IF EXISTS testimonials CASCADE;');
        await pool.query(`
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
        `);
      }
    });

    console.log('Database schema fixed successfully!');
  } catch (error) {
    console.error('Error fixing schema:', error);
  } finally {
    await pool.end();
  }
}

fixSchema().catch(console.error);
