# Структура базы данных

База данных: **SQLite**  
Файл: `backend/database.db`

Ниже указаны основные сущности, их атрибуты и связи.

---

## Сущности и атрибуты

### users
- **id** (PK, integer)
- email (string, unique)
- password (string)
- first_name (string)
- last_name (string)
- phone (string, optional)
- address (string, optional)
- city (string, optional)
- postal_code (string, optional)
- avatar_url (string, optional)
- role (string, default: `user`)
- is_active (boolean)
- created_at (datetime)
- updated_at (datetime)

### categories
- **id** (PK, integer)
- name (string)
- slug (string, unique)
- description (string, optional)
- image_url (string, optional)
- icon_url (string, optional)
- parent_id (FK → categories.id, nullable)
- is_active (boolean)
- created_at (datetime)
- updated_at (datetime)

### brands
- **id** (PK, integer)
- name (string)
- slug (string, unique)
- logo_url (string, optional)
- description (string, optional)
- is_active (boolean)
- created_at (datetime)
- updated_at (datetime)

### products
- **id** (PK, integer)
- name (string)
- slug (string, unique)
- description (string, optional)
- short_description (string, optional)
- price (decimal)
- sale_price (decimal, optional)
- sku (string, unique, optional)
- stock_quantity (integer)
- stock_status (string)
- category_id (FK → categories.id, nullable)
- brand_id (FK → brands.id, nullable)
- weight (decimal, optional)
- dimensions (string/JSON, optional)
- images (string/JSON, optional)
- specifications (string/JSON, optional)
- is_featured (boolean)
- is_active (boolean)
- seo_title (string, optional)
- seo_description (string, optional)
- created_at (datetime)
- updated_at (datetime)

### product_categories
Связующая таблица для “многие‑ко‑многим” между продуктами и категориями.
- **id** (PK, integer)
- product_id (FK → products.id)
- category_id (FK → categories.id)
- created_at (datetime)

### reviews
- **id** (PK, integer)
- product_id (FK → products.id)
- user_id (FK → users.id)
- rating (integer)
- title (string, optional)
- comment (string, optional)
- is_verified (boolean)
- is_active (boolean)
- created_at (datetime)
- updated_at (datetime)

### orders
- **id** (PK, integer)
- user_id (FK → users.id)
- order_number (string, unique)
- status (string)
- total_amount (decimal)
- shipping_amount (decimal)
- discount_amount (decimal)
- tax_amount (decimal)
- currency (string)
- shipping_address (string/JSON)
- billing_address (string/JSON, optional)
- payment_method (string)
- payment_status (string)
- shipping_method (string, optional)
- notes (string, optional)
- payment_id (string, optional)
- payment_confirmation_url (string, optional)
- payment_paid_at (datetime, optional)
- created_at (datetime)
- updated_at (datetime)

### order_items
- **id** (PK, integer)
- order_id (FK → orders.id)
- product_id (FK → products.id)
- quantity (integer)
- price (decimal)
- total (decimal)
- created_at (datetime)

### cart
- **id** (PK, integer)
- user_id (FK → users.id, nullable)
- session_id (string, nullable)
- product_id (FK → products.id)
- quantity (integer)
- created_at (datetime)
- updated_at (datetime)

### favorites
- **id** (PK, integer)
- user_id (FK → users.id)
- product_id (FK → products.id)
- created_at (datetime)

### site_settings
Таблица для настроек сайта (баннеры, контакты и т.п.)
- **key** (PK, string)
- value (string/JSON)
- updated_at (datetime)

---

## Связи между сущностями

- **users 1—N orders**  
  Один пользователь может иметь много заказов.

- **users 1—N reviews**  
  Пользователь может оставлять несколько отзывов.

- **users 1—N favorites**  
  Пользователь может добавлять много товаров в избранное.

- **categories 1—N products**  
  Основная категория товара хранится в `products.category_id`.

- **categories N—N products**  
  Через таблицу `product_categories`.

- **products 1—N reviews**  
  Один товар может иметь много отзывов.

- **orders 1—N order_items**  
  Заказ содержит много позиций.

- **products 1—N order_items**  
  Товар может входить в разные заказы.

- **users 1—N cart**  
  Корзина может быть привязана к пользователю или сессии.

- **brands 1—N products**  
  Один бренд содержит много товаров.
