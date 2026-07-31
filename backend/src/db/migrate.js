const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function tableExists(connection, dbName, table) {
  const [rows] = await connection.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, table]
  );
  return rows.length > 0;
}

async function getColumnNames(connection, dbName, table) {
  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, table]
  );
  return cols.map((c) => c.COLUMN_NAME);
}

async function migrateIsActive(connection, dbName, table, afterColumn) {
  if (!(await tableExists(connection, dbName, table))) return;
  const colNames = await getColumnNames(connection, dbName, table);
  if (colNames.includes('is_active')) return;

  console.log(`[db] Adding is_active column to ${table}...`);
  await connection.query(
    `ALTER TABLE ${table} ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER ${afterColumn}`
  );
}

async function migrateUserStatusRejected(connection, dbName) {
  if (!(await tableExists(connection, dbName, 'users'))) return;
  const [rows] = await connection.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'`,
    [dbName]
  );
  if (rows.length === 0 || rows[0].COLUMN_TYPE.includes("'rejected'")) return;

  console.log('[db] Adding "rejected" to users.status enum...');
  await connection.query(
    `ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'`
  );
}

async function migrateOrdersSchema(connection, dbName) {
  if (!(await tableExists(connection, dbName, 'orders'))) return;
  const colNames = await getColumnNames(connection, dbName, 'orders');

  if (!colNames.includes('customer_id')) {
    console.log('[db] Migrating orders table for customer support + new status set...');
    if (!(await tableExists(connection, dbName, 'customers'))) {
      await connection.query(`
        CREATE TABLE customers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(100) NOT NULL,
          whatsapp_number VARCHAR(30) NOT NULL UNIQUE,
          email VARCHAR(150) DEFAULT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    await connection.query(`ALTER TABLE orders ADD COLUMN customer_id INT NULL AFTER user_id`);
    await connection.query(`ALTER TABLE orders MODIFY COLUMN user_id INT NULL`);
    await connection.query(
      `ALTER TABLE orders ADD CONSTRAINT fk_orders_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE`
    );
    await connection.query(`ALTER TABLE orders MODIFY COLUMN shipping_name VARCHAR(100) NULL`);
    await connection.query(`ALTER TABLE orders MODIFY COLUMN shipping_phone VARCHAR(30) NULL`);
    await connection.query(`ALTER TABLE orders MODIFY COLUMN shipping_address VARCHAR(255) NULL`);
  }

  const [statusCol] = await connection.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'status'`,
    [dbName]
  );
  if (statusCol.length > 0 && statusCol[0].COLUMN_TYPE.includes("'processing'")) {
    console.log('[db] Migrating orders.status to Pending/Successful/Return/Cancelled...');
    await connection.query(
      `ALTER TABLE orders MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'`
    );
    await connection.query(`UPDATE orders SET status = 'pending' WHERE status IN ('processing', 'shipped')`);
    await connection.query(`UPDATE orders SET status = 'successful' WHERE status = 'delivered'`);
    await connection.query(
      `ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'successful', 'return', 'cancelled') NOT NULL DEFAULT 'pending'`
    );
  }
}

async function migrateProductPricing(connection, dbName) {
  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'`,
    [dbName]
  );
  if (tables.length === 0) return;

  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'`,
    [dbName]
  );
  const colNames = cols.map((c) => c.COLUMN_NAME);
  const hasOldPrice = colNames.includes('price');

  if (!hasOldPrice) return;

  console.log('[db] Migrating products table to purchase/sale price + percentage discount...');

  if (!colNames.includes('purchase_price')) {
    await connection.query(
      `ALTER TABLE products ADD COLUMN purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER category_id`
    );
  }
  if (!colNames.includes('discount_percent')) {
    await connection.query(
      `ALTER TABLE products ADD COLUMN discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER price`
    );
    await connection.query(`
      UPDATE products
      SET discount_percent = CASE
        WHEN discount_price IS NOT NULL AND price > 0
        THEN ROUND((1 - discount_price / price) * 100, 2)
        ELSE 0
      END
    `);
  }

  await connection.query(`ALTER TABLE products DROP COLUMN discount_price`);
  await connection.query(`ALTER TABLE products CHANGE COLUMN price sale_price DECIMAL(10,2) NOT NULL`);
  await connection.query(`
    ALTER TABLE products
    ADD COLUMN discount_price DECIMAL(10,2)
    GENERATED ALWAYS AS (ROUND(sale_price - (sale_price * discount_percent / 100), 2)) STORED
    AFTER discount_percent
  `);

  console.log('[db] Product pricing migration complete.');
}

const SEED_PRODUCT_CODES = {
  'rc-car-4ch-drift-racing': '1001',
  'yp3-foam-aircraft-fighter': '1002',
  'sky-falcon-rc-mini-helicopter': '1003',
  'rc-rock-crawler-4wd': '1004',
  'building-puzzle-flying-scotsman': '1005',
  'rc-race-car-building-blocks': '1006',
  'kids-rotating-tower-ball-drop': '1007',
  'kids-ride-on-electric-car': '1008',
  'kids-spiderman-bodysuit-costume': '1009',
  'baby-girl-floral-romper': '1010',
  'postpartum-belly-band': '1011',
  'wooden-alphabet-learning-blocks': '1012',
};

async function migrateProductCode(connection, dbName) {
  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'`,
    [dbName]
  );
  if (tables.length === 0) return;

  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'`,
    [dbName]
  );
  const colNames = cols.map((c) => c.COLUMN_NAME);

  if (!colNames.includes('product_code')) {
    console.log('[db] Adding product_code column to products...');
    await connection.query(
      `ALTER TABLE products ADD COLUMN product_code VARCHAR(50) DEFAULT NULL UNIQUE AFTER slug`
    );
  }

  for (const [slug, code] of Object.entries(SEED_PRODUCT_CODES)) {
    await connection.query(
      `UPDATE products SET product_code = ? WHERE slug = ? AND product_code IS NULL`,
      [code, slug]
    );
  }
}

async function migrateOrderItemsProductCode(connection, dbName) {
  if (!(await tableExists(connection, dbName, 'order_items'))) return;
  const colNames = await getColumnNames(connection, dbName, 'order_items');
  if (colNames.includes('product_code')) return;

  console.log('[db] Adding product_code column to order_items...');
  await connection.query(
    `ALTER TABLE order_items ADD COLUMN product_code VARCHAR(50) DEFAULT NULL AFTER product_name`
  );
  await connection.query(`
    UPDATE order_items oi JOIN products p ON p.id = oi.product_id
    SET oi.product_code = p.product_code
    WHERE oi.product_code IS NULL
  `);
}

async function migrateUserRoles(connection, dbName) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(20) NOT NULL UNIQUE
    )
  `);
  await connection.query(`
    INSERT INTO user_roles (name) VALUES ('SuperAdmin'), ('Admin'), ('Seller'), ('Customer')
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `);

  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [dbName]
  );
  if (tables.length === 0) return;

  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [dbName]
  );
  const colNames = cols.map((c) => c.COLUMN_NAME);
  if (!colNames.includes('role')) return;

  console.log('[db] Migrating users.role (enum) to users.role_id (FK to user_roles)...');

  if (!colNames.includes('role_id')) {
    await connection.query(`ALTER TABLE users ADD COLUMN role_id INT NULL AFTER role`);
  }

  const roleMap = { customer: 'Customer', seller: 'Seller', admin: 'Admin', superadmin: 'SuperAdmin' };
  for (const [oldVal, newName] of Object.entries(roleMap)) {
    await connection.query(
      `UPDATE users u JOIN user_roles r ON r.name = ? SET u.role_id = r.id WHERE u.role = ? AND u.role_id IS NULL`,
      [newName, oldVal]
    );
  }
  await connection.query(`
    UPDATE users u JOIN user_roles r ON r.name = 'Customer'
    SET u.role_id = r.id WHERE u.role_id IS NULL
  `);

  await connection.query(`ALTER TABLE users MODIFY COLUMN role_id INT NOT NULL`);
  await connection.query(`ALTER TABLE users DROP COLUMN role`);
  await connection.query(`
    ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES user_roles(id)
  `);

  console.log('[db] users.role_id migration complete.');
}

async function migrateUserStatus(connection, dbName) {
  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [dbName]
  );
  if (tables.length === 0) return;

  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [dbName]
  );
  const colNames = cols.map((c) => c.COLUMN_NAME);
  if (colNames.includes('status')) return;

  console.log('[db] Adding status column to users (pending/approved)...');
  await connection.query(
    `ALTER TABLE users ADD COLUMN status ENUM('pending', 'approved') NOT NULL DEFAULT 'approved' AFTER role_id`
  );
}

const CORE_USERS = [
  {
    name: 'Super Admin',
    getEmail: () => process.env.SUPERADMIN_USERNAME || 'Prusoth26',
    getPassword: () => process.env.SUPERADMIN_PASSWORD || 'Pruso2002',
    phone: '0765947337',
    address: 'Nallur',
    role: 'SuperAdmin',
  },
  {
    name: 'Admin',
    getEmail: () => 'Admin@gmail.com',
    getPassword: () => 'Admin123',
    phone: '0123456789',
    address: 'Colombo',
    role: 'Admin',
  },
];

async function ensureCoreUsers(connection) {
  for (const def of CORE_USERS) {
    const email = def.getEmail();
    const password = def.getPassword();

    const [[role]] = await connection.query('SELECT id FROM user_roles WHERE name = ?', [def.role]);
    if (!role) continue;

    const matchByRole = def.role === 'SuperAdmin';
    const [existing] = await connection.query(
      matchByRole
        ? `SELECT u.id FROM users u
           JOIN user_roles r ON r.id = u.role_id
           WHERE u.email = ? OR r.name = 'SuperAdmin'
           ORDER BY CASE WHEN u.email = ? THEN 0 ELSE 1 END
           LIMIT 1`
        : `SELECT id FROM users WHERE email = ? LIMIT 1`,
      matchByRole ? [email, email] : [email]
    );

    const hashed = await bcrypt.hash(password, 10);
    if (existing.length > 0) {
      await connection.query(
        `UPDATE users SET name = ?, email = ?, password = ?, phone = ?, address = ?, role_id = ?, status = 'approved', is_active = 1 WHERE id = ?`,
        [def.name, email, hashed, def.phone, def.address, role.id, existing[0].id]
      );
      console.log(`[db] ${def.role} user updated (id=${existing[0].id}, email=${email}).`);
    } else {
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password, phone, address, role_id, status, is_active) VALUES (?, ?, ?, ?, ?, ?, 'approved', 1)`,
        [def.name, email, hashed, def.phone, def.address, role.id]
      );
      console.log(`[db] ${def.role} user created (id=${result.insertId}, email=${email}).`);
    }
  }
}

async function migrate() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${DB_NAME}\``);

    await migrateUserRoles(connection, DB_NAME);
    await migrateUserStatus(connection, DB_NAME);
    await migrateUserStatusRejected(connection, DB_NAME);
    await migrateIsActive(connection, DB_NAME, 'users', 'status');
    await migrateProductPricing(connection, DB_NAME);
    await migrateProductCode(connection, DB_NAME);
    await migrateIsActive(connection, DB_NAME, 'products', 'featured');
    await migrateIsActive(connection, DB_NAME, 'categories', 'image');
    await migrateOrdersSchema(connection, DB_NAME);
    await migrateOrderItemsProductCode(connection, DB_NAME);

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schemaSql);

    await ensureCoreUsers(connection);

    console.log(`[db] Database "${DB_NAME}" and tables are ready.`);
  } finally {
    await connection.end();
  }
}

module.exports = migrate;
