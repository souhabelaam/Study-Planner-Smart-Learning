import './loadEnv.js';
import mysql from 'mysql2/promise';

function getConfig() {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? 'root',
    database: process.env.MYSQL_DATABASE || 'studyplanner',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true
  };
}

export let pool;

export async function connectDatabase() {
  const config = getConfig();
  const bootstrap = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
  await bootstrap.end();

  pool = mysql.createPool(config);
  await pool.query('SELECT 1');
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

export async function initSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS roles (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(20) NOT NULL UNIQUE
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS user_roles (
      user_id BIGINT NOT NULL,
      role_id BIGINT NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS user_settings (
      user_id BIGINT NOT NULL PRIMARY KEY,
      daily_goal_minutes INT NOT NULL DEFAULT 60,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS subjects (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      name VARCHAR(100) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS study_sessions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      subject_id BIGINT NOT NULL,
      duration_minutes INT NOT NULL,
      date DATE NOT NULL,
      start_hour INT NULL,
      start_minute INT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS student_notes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      subject_id BIGINT NULL,
      title VARCHAR(150) NOT NULL,
      content TEXT NULL,
      grade DECIMAL(4,2) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS advertisements (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description VARCHAR(500) NOT NULL,
      link_url VARCHAR(500) NULL,
      image_url VARCHAR(500) NULL,
      audience VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS game_scores (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      score INT NOT NULL,
      moves INT NOT NULL,
      duration_seconds INT NOT NULL,
      played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  ];

  for (const sql of statements) {
    await pool.query(sql);
  }

  // Migration: ensure student_notes timestamps have proper DEFAULT values
  // (handles tables created before the schema was updated)
  const migrations = [
    `ALTER TABLE student_notes
       MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ];
  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (err) {
      // Ignore if column already correct or table doesn't exist yet
      if (err.code !== 'ER_BAD_FIELD_ERROR' && err.code !== 'ER_NO_SUCH_TABLE') {
        console.warn('[migration] warning:', err.message);
      }
    }
  }

  const indexes = [
    'CREATE INDEX idx_subjects_user ON subjects(user_id)',
    'CREATE INDEX idx_sessions_user ON study_sessions(user_id)',
    'CREATE INDEX idx_notes_user ON student_notes(user_id)',
    'CREATE INDEX idx_game_user ON game_scores(user_id, score DESC)'
  ];
  for (const sql of indexes) {
    try {
      await pool.query(sql);
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
    }
  }

  const roleCols = (await pool.query('SHOW COLUMNS FROM roles'))[0].map((c) => c.Field);
  for (const name of ['ADMIN', 'USER']) {
    if (roleCols.includes('created_at')) {
      await pool.query('INSERT IGNORE INTO roles (name, created_at) VALUES (?, NOW())', [name]);
    } else {
      await pool.query('INSERT IGNORE INTO roles (name) VALUES (?)', [name]);
    }
  }
}

export async function getUserRoles(userId) {
  const rows = await query(
    `SELECT r.name FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ?`,
    [userId]
  );
  return rows.map((r) => r.name);
}

export async function findUserByUsername(username) {
  const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return null;
  return { ...user, roles: await getUserRoles(user.id) };
}

export async function findUserById(id) {
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) return null;
  return { ...user, roles: await getUserRoles(user.id) };
}

export async function getRoleId(name) {
  const row = await queryOne('SELECT id FROM roles WHERE name = ?', [name]);
  return row?.id ?? null;
}

export function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function formatDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
