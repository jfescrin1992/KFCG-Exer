#!/usr/bin/env node

/**
 * ExerFit Automated Setup & Database Provisioning Script
 * Runs on Windows, macOS, and Linux for zero-config local & cloud deployment.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('\n======================================================');
console.log('  🏋️‍♂️ KFCG EXERFIT - AUTOMATED SETUP WIZARD');
console.log('======================================================\n');

async function runSetup() {
  try {
    // 1. Check Node.js runtime version
    const nodeMajorVersion = parseInt(process.versions.node.split('.')[0], 10);
    if (nodeMajorVersion < 18) {
      console.warn(`⚠️  Warning: Node.js version ${process.version} detected. Recommended version is 18, 20, or 22+.\n`);
    } else {
      console.log(`✅ Node.js ${process.version} detected.`);
    }

    // 2. Manage .env Configuration File
    const envPath = path.join(rootDir, '.env');
    let envContent = '';
    let isNewEnv = false;

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
      console.log('✅ Found existing .env configuration file.');
    } else {
      isNewEnv = true;
      console.log('📝 Creating new .env configuration file...\n');
      
      const jwtSecret = crypto.randomBytes(32).toString('hex');

      console.log('Select your PostgreSQL Database mode:');
      console.log('  [1] Free Cloud Postgres (Neon.tech / Supabase / Render - Recommended, no local install needed)');
      console.log('  [2] Local PostgreSQL Server (localhost:5432)');
      console.log('  [3] Default Quick Setup (Pre-configured local/cloud credentials)');

      const choice = (await askQuestion('\nEnter choice [1, 2, or 3] (default 3): ')).trim() || '3';

      let dbUrl = '';
      let sqlHost = 'localhost';
      let sqlPort = '5432';
      let sqlUser = 'postgres';
      let sqlPass = 'postgres';
      let sqlDb = 'exerfit_db';

      if (choice === '1') {
        dbUrl = (await askQuestion('\nPaste your PostgreSQL Connection URL (e.g. postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require): ')).trim();
      } else if (choice === '2') {
        sqlHost = (await askQuestion('\nDatabase Host (default localhost): ')).trim() || 'localhost';
        sqlPort = (await askQuestion('Database Port (default 5432): ')).trim() || '5432';
        sqlUser = (await askQuestion('Database User (default postgres): ')).trim() || 'postgres';
        sqlPass = (await askQuestion('Database Password (default postgres): ')).trim() || 'postgres';
        sqlDb = (await askQuestion('Database Name (default exerfit_db): ')).trim() || 'exerfit_db';
      }

      const geminiKey = (await askQuestion('\nOptional: Gemini API Key (press Enter to skip): ')).trim();

      envContent = `# KFCG ExerFit Configuration
PORT=3000
JWT_SECRET=${jwtSecret}

# Database Configuration
${dbUrl ? `DATABASE_URL=${dbUrl}` : `# Local / Cloud Postgres
SQL_HOST=${sqlHost}
SQL_PORT=${sqlPort}
SQL_USER=${sqlUser}
SQL_PASSWORD=${sqlPass}
SQL_DB_NAME=${sqlDb}`}

# Google Gemini AI Key
GEMINI_API_KEY=${geminiKey || ''}
`;

      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log('\n✅ .env file successfully created!');
    }

    // 3. Parse Environment for Database Verification & Initialization
    const envLines = envContent.split('\n');
    const envVars = {};
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k) envVars[k.trim()] = v.join('=').trim();
      }
    }

    const connectionString = envVars.DATABASE_URL || process.env.DATABASE_URL;
    let clientConfig;

    if (connectionString) {
      const isCloud = connectionString.includes('neon.tech') || connectionString.includes('supabase.co') || connectionString.includes('render.com') || connectionString.includes('sslmode=require');
      clientConfig = {
        connectionString,
        ssl: isCloud ? { rejectUnauthorized: false } : undefined,
      };
    } else {
      const host = envVars.SQL_HOST || process.env.SQL_HOST || 'localhost';
      const isLocalhost = host === 'localhost' || host === '127.0.0.1';
      clientConfig = {
        host,
        port: Number(envVars.SQL_PORT || process.env.SQL_PORT || 5432),
        user: envVars.SQL_USER || process.env.SQL_USER || 'postgres',
        password: envVars.SQL_PASSWORD || process.env.SQL_PASSWORD || 'postgres',
        database: envVars.SQL_DB_NAME || process.env.SQL_DB_NAME || 'exerfit_db',
        ssl: !isLocalhost ? { rejectUnauthorized: false } : undefined,
      };
    }

    console.log('\n⏳ Connecting to PostgreSQL database to verify & initialize schemas...');

    const client = new Client(clientConfig);

    try {
      await client.connect();
      console.log('✅ Connected to database successfully.');

      console.log('⚙️  Creating required tables if they do not exist...');
      
      // Execute table creation DDL
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          uid TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL DEFAULT '',
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          grade TEXT,
          section TEXT,
          student_code TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS users_uid_idx ON users(uid);
        CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

        CREATE TABLE IF NOT EXISTS sections (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS sections_name_idx ON sections(name);

        CREATE TABLE IF NOT EXISTS assessments (
          id SERIAL PRIMARY KEY,
          student_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
          student_name TEXT NOT NULL,
          grade TEXT NOT NULL,
          section TEXT NOT NULL,
          component_id TEXT NOT NULL,
          score DOUBLE PRECISION NOT NULL,
          raw_result TEXT NOT NULL,
          valid_reps DOUBLE PRECISION NOT NULL DEFAULT 0,
          invalid_reps DOUBLE PRECISION NOT NULL DEFAULT 0,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS assessments_student_idx ON assessments(student_id);
        CREATE INDEX IF NOT EXISTS assessments_grade_section_idx ON assessments(grade, section);
        CREATE INDEX IF NOT EXISTS assessments_timestamp_idx ON assessments(timestamp);

        CREATE TABLE IF NOT EXISTS warmup_videos (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL DEFAULT 'Warmup Routine',
          type TEXT NOT NULL,
          url TEXT NOT NULL,
          duration INTEGER NOT NULL DEFAULT 15,
          created_by TEXT NOT NULL DEFAULT 'Faculty',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS warmup_videos_category_idx ON warmup_videos(category);
      `);

      // Seed default sections
      const sectionsCheck = await client.query('SELECT COUNT(*) FROM sections');
      if (parseInt(sectionsCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO sections (name) VALUES 
            ('Section A'), ('Section B'), ('Section C'), 
            ('STEM 1'), ('STEM 2'), ('Newton'), ('Einstein'), ('Pascal')
          ON CONFLICT DO NOTHING;
        `);
        console.log('✅ Seeded default PE sections.');
      }

      // Seed default warmup videos
      const videosCheck = await client.query('SELECT COUNT(*) FROM warmup_videos');
      if (parseInt(videosCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO warmup_videos (title, description, category, type, url, duration, created_by)
          VALUES 
            ('March in Place', 'Lift your knees high while rhythmically swinging your arms.', 'Warmup Routine', 'link', 'https://www.youtube.com/embed/zL8D-m4aW5Y', 15, 'PE Faculty'),
            ('Arm Circles', 'Small circles moving forward, then larger reverse circles.', 'Warmup Routine', 'link', 'https://www.youtube.com/embed/S_7M_q8wRNo', 15, 'PE Faculty'),
            ('Side Steps & Reach', 'Step left to right, reaching arms overhead.', 'Warmup Routine', 'link', 'https://www.youtube.com/embed/S6z79_NAnX8', 15, 'PE Faculty'),
            ('Light Jogging', 'Bounce lightly on your toes with relaxed shoulders.', 'Warmup Routine', 'link', 'https://www.youtube.com/embed/mS_mP3wVb4g', 15, 'PE Faculty')
          ON CONFLICT DO NOTHING;
        `);
        console.log('✅ Seeded default faculty demonstration videos.');
      }

      // Seed default Demo Accounts if needed
      const passwordHash = crypto.createHash('sha256').update('password123' + 'fitness_salt_key!').digest('hex');
      await client.query(`
        INSERT INTO users (uid, email, password, name, role)
        VALUES 
          ('demo-faculty-01', 'teacher@demo.com', $1, 'Demo Faculty', 'teacher'),
          ('demo-student-01', 'student@demo.com', $1, 'Demo Student', 'student')
        ON CONFLICT (uid) DO NOTHING;
      `, [passwordHash]);
      console.log('✅ Demo accounts ready (teacher@demo.com & student@demo.com / password123).');

      await client.end();
      console.log('✅ Database setup completed successfully!\n');

    } catch (dbErr) {
      console.warn('\n⚠️  Database notice: Could not connect to PostgreSQL server immediately.');
      console.log(`   Details: ${dbErr.message}`);
      console.log('\n💡 Quick Tips:');
      console.log('   - If using local Postgres: Make sure PostgreSQL service is running and credentials in .env match.');
      console.log('   - Or use Free Serverless Postgres in 2 mins: Go to https://neon.tech, create a free database, and set DATABASE_URL in .env.');
      console.log('   - The server will also automatically retry auto-init upon startup!\n');
    }

    console.log('======================================================');
    console.log('  🎉 EXERFIT IS READY TO RUN!');
    console.log('======================================================');
    console.log('To start development server:');
    console.log('  👉 npm run dev\n');
    console.log('To build and run in production:');
    console.log('  👉 npm run build');
    console.log('  👉 npm start\n');
    console.log('Open your browser at: http://localhost:3000\n');

  } catch (err) {
    console.error('Setup encountered an error:', err);
  } finally {
    rl.close();
  }
}

runSetup();
