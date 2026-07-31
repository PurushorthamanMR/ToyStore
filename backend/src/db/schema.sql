CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO user_roles (name) VALUES ('SuperAdmin'), ('Admin'), ('Seller'), ('Customer')
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  address VARCHAR(255),
  role_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES user_roles(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  whatsapp_number VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(150) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  image VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  product_code VARCHAR(50) DEFAULT NULL UNIQUE,
  description TEXT,
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  discount_price DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(sale_price - (sale_price * discount_percent / 100), 2)) STORED,
  stock INT NOT NULL DEFAULT 0,
  image VARCHAR(255),
  featured TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  customer_id INT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'successful', 'return', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cod',
  shipping_name VARCHAR(100) NULL,
  shipping_phone VARCHAR(30) NULL,
  shipping_address VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(200) NOT NULL,
  product_code VARCHAR(50) DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_type ENUM('customer', 'staff') NOT NULL,
  owner_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_wishlist (owner_type, owner_id, product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  images JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed categories
INSERT INTO categories (name, slug, image) VALUES
  ('Remote Control Toys', 'remote-control-toys', 'https://picsum.photos/seed/rc/400/300'),
  ('Building Blocks & Puzzles', 'building-blocks-puzzles', 'https://picsum.photos/seed/blocks/400/300'),
  ('Dolls & Soft Toys', 'dolls-soft-toys', 'https://picsum.photos/seed/dolls/400/300'),
  ('Outdoor & Ride-On', 'outdoor-ride-on', 'https://picsum.photos/seed/outdoor/400/300'),
  ('Baby & Kids Wear', 'baby-kids-wear', 'https://picsum.photos/seed/babywear/400/300'),
  ('Educational Toys', 'educational-toys', 'https://picsum.photos/seed/edu/400/300')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed products
-- columns: category_id, name, slug, product_code, description, purchase_price, sale_price, discount_percent, stock, image, featured
INSERT INTO products (category_id, name, slug, product_code, description, purchase_price, sale_price, discount_percent, stock, image, featured) VALUES
  (1, 'RC Car 4Ch High-Speed Drift Racing Car', 'rc-car-4ch-drift-racing', '1001', 'Electric sportscar toy vehicle model with high-speed drift capability.', 2400.00, 3650.00, 0, 25, 'https://picsum.photos/seed/rc1/400/300', 1),
  (1, 'YP3 Foam Aircraft Remote Control Fighter Jet', 'yp3-foam-aircraft-fighter', '1002', 'Four axle wrestle-resistant aerial stunt airplane, great gift for kids.', 3000.00, 4500.00, 0, 15, 'https://picsum.photos/seed/rc2/400/300', 1),
  (1, 'Sky Falcon RC Mini Helicopter', 'sky-falcon-rc-mini-helicopter', '1003', 'Hand sensor flying toy, USB rechargeable.', 1500.00, 2250.00, 0, 30, 'https://picsum.photos/seed/rc3/400/300', 0),
  (1, '1:8 Large RC Rock Crawler 4WD Off-Road', 'rc-rock-crawler-4wd', '1004', 'Large scale off-road remote control vehicle for kids.', 10500.00, 15500.00, 0, 8, 'https://picsum.photos/seed/rc4/400/300', 0),
  (2, 'Building Model Puzzle - Flying Scotsman Train', 'building-puzzle-flying-scotsman', '1005', 'Lego-type building block train set, 340 pieces.', 3300.00, 4950.00, 0, 20, 'https://picsum.photos/seed/blk1/400/300', 1),
  (2, 'RC Race Car Building Blocks Set', 'rc-race-car-building-blocks', '1006', 'Remote control model car building kit for kids.', 4300.00, 6500.00, 0, 12, 'https://picsum.photos/seed/blk2/400/300', 0),
  (2, 'Kids Rotating Tower Ball Drop Toy', 'kids-rotating-tower-ball-drop', '1007', 'Educational rolling ball track toy for toddlers.', 1500.00, 2250.00, 12, 40, 'https://picsum.photos/seed/blk3/400/300', 0),
  (4, 'Four Wheels Kids Ride-On Electric Car', 'kids-ride-on-electric-car', '1008', 'Battery powered luxury ride-on toy car for children with remote control.', 24000.00, 35500.00, 7, 6, 'https://picsum.photos/seed/ride1/400/300', 1),
  (3, 'Kids Spider-Man Inspired Bodysuit Costume', 'kids-spiderman-bodysuit-costume', '1009', 'Red and black superhero costume for role play.', 2000.00, 2990.00, 0, 22, 'https://picsum.photos/seed/dolls1/400/300', 0),
  (5, 'Baby Girl Floral Cotton Dress Romper', 'baby-girl-floral-romper', '1010', 'Summer newborn outfit with bow headband.', 1300.00, 1990.00, 0, 35, 'https://picsum.photos/seed/wear1/400/300', 0),
  (5, 'Postpartum Belly Band Pregnancy Belt', 'postpartum-belly-band', '1011', 'Comfortable support belt for new mothers.', 1200.00, 1850.00, 0, 50, 'https://picsum.photos/seed/wear2/400/300', 0),
  (6, 'Wooden Alphabet Learning Blocks Set', 'wooden-alphabet-learning-blocks', '1012', 'Educational wooden blocks to help kids learn letters and numbers.', 1600.00, 2450.00, 0, 28, 'https://picsum.photos/seed/edu1/400/300', 0)
ON DUPLICATE KEY UPDATE name = VALUES(name);
