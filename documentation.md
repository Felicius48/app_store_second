# Документация проекта TechStore

## 1. Архитектура и структура проекта

### Общая архитектура
Проект построен по классической схеме **Client–Server**:
- **Frontend (React)**: отвечает за UI, маршрутизацию и взаимодействие с API.
- **Backend (Node.js/Express)**: реализует REST API, бизнес-логику, работу с БД и интеграцию с платёжной системой.
- **SQLite**: основная БД проекта.

### Структура проекта
```
app_store_second/
├── backend/                 # Серверная часть
│   ├── config/              # Конфигурации (БД и др.)
│   ├── migrations/          # Миграции knex
│   ├── models/              # Модели данных
│   ├── routes/              # API маршруты
│   ├── middleware/          # Middleware (auth, error handling)
│   ├── scripts/             # Скрипты инициализации БД
│   ├── uploads/             # Загруженные файлы
│   ├── app.js / server.js   # Инициализация приложения
│   └── knexfile.js          # Конфиг миграций
├── frontend/                # Клиентская часть
│   ├── src/
│   │   ├── components/      # UI компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── features/        # Redux slices
│   │   ├── services/        # API сервисы
│   │   ├── routes/          # Маршруты приложения
│   │   ├── layouts/         # Общие лэйауты
│   │   └── store/           # Redux store
│   └── public/              # Статика
├── start.sh                 # Скрипт запуска
└── documentation.md         # Текущий документ
```

---

## 2. Диаграмма деятельности

Ниже пример типового сценария оформления заказа:

```mermaid
flowchart TD
  %% Nodes
  A([Старт: пользователь на сайте])
  B[Добавляет товары в корзину]
  C[Переходит в оформление заказа]
  D{Авторизован?}
  E[Логин / Регистрация]
  F[Заполняет адрес доставки]
  G[Создает заказ]
  H{Оплата онлайн?}
  I[Заказ создан\nстатус: pending]
  J[Редирект в YooKassa]
  K[Webhook подтверждает оплату]
  L[Статус оплаты: paid]
  M([OrderSuccess\nКорзина очищается])

  %% Flow
  A --> B --> C --> D
  D -- Нет --> E --> F
  D -- Да --> F
  F --> G --> H
  H -- Нет --> I --> M
  H -- Да --> J --> K --> L --> M

  %% Styles
  classDef decision fill:#FFF4CC,stroke:#D9A900,color:#5E4B00;
  classDef success fill:#E9FBE7,stroke:#2C7A1F,color:#1F4B19;
  classDef action fill:#EEF4FF,stroke:#3B82F6,color:#1E3A8A;
  class D,H decision;
  class M success;
  class A,B,C,E,F,G,I,J,K,L action;
```

---

## 3. ER-диаграмма базы данных (полная)

```mermaid
erDiagram
  USERS ||--o{ ORDERS : places
  USERS ||--o{ REVIEWS : writes
  USERS ||--o{ FAVORITES : saves

  PRODUCTS ||--o{ REVIEWS : receives
  PRODUCTS ||--o{ ORDER_ITEMS : contains
  PRODUCTS ||--o{ PRODUCT_CATEGORIES : links

  ORDERS ||--o{ ORDER_ITEMS : includes

  CATEGORIES ||--o{ PRODUCTS : categorizes
  CATEGORIES ||--o{ PRODUCT_CATEGORIES : links

  BRANDS ||--o{ PRODUCTS : owns
  USERS ||--o{ CART : keeps
  PRODUCTS ||--o{ CART : stored_in

  USERS {
    int id PK
    string email
    string password
    string first_name
    string last_name
    string phone
    string address
    string city
    string postal_code
    string avatar_url
    string role
    boolean is_active
    datetime created_at
    datetime updated_at
  }

  CATEGORIES {
    int id PK
    string name
    string slug
    string description
    string image_url
    string icon_url
    int parent_id FK
    boolean is_active
    datetime created_at
    datetime updated_at
  }

  BRANDS {
    int id PK
    string name
    string slug
    string logo_url
    string description
    boolean is_active
    datetime created_at
    datetime updated_at
  }

  PRODUCTS {
    int id PK
    string name
    string slug
    string description
    string short_description
    decimal price
    decimal sale_price
    string sku
    int stock_quantity
    string stock_status
    int category_id FK
    int brand_id FK
    decimal weight
    string dimensions
    string images
    boolean is_featured
    boolean is_active
    string seo_title
    string seo_description
    string specifications
    datetime created_at
    datetime updated_at
  }

  REVIEWS {
    int id PK
    int product_id FK
    int user_id FK
    int rating
    string title
    string comment
    boolean is_verified
    boolean is_active
    datetime created_at
    datetime updated_at
  }

  ORDERS {
    int id PK
    int user_id FK
    string order_number
    string status
    decimal total_amount
    decimal shipping_amount
    decimal discount_amount
    decimal tax_amount
    string currency
    string shipping_address
    string billing_address
    string payment_method
    string payment_status
    string shipping_method
    string notes
    string payment_id
    string payment_confirmation_url
    datetime payment_paid_at
    datetime created_at
    datetime updated_at
  }

  ORDER_ITEMS {
    int id PK
    int order_id FK
    int product_id FK
    int quantity
    decimal price
    decimal total
    datetime created_at
  }

  CART {
    int id PK
    int user_id FK
    string session_id
    int product_id FK
    int quantity
    datetime created_at
    datetime updated_at
  }

  COUPONS {
    int id PK
    string code
    string discount_type
    decimal discount_value
    decimal min_order_amount
    decimal max_discount
    int usage_limit
    int used_count
    datetime expiry_date
    boolean is_active
    datetime created_at
  }

  PRODUCT_CATEGORIES {
    int id PK
    int product_id FK
    int category_id FK
    datetime created_at
  }

  FAVORITES {
    int id PK
    int user_id FK
    int product_id FK
    datetime created_at
  }

  SITE_SETTINGS {
    string key PK
    string value
    datetime updated_at
  }
```

### Основные сущности
- **users**: id, email, password, first_name, last_name, phone, role, address, avatar_url …
- **products**: id, name, price, sku, images, specifications, is_featured …
- **categories**: id, name, slug, image_url, icon_url, parent_id …
- **orders**: id, user_id, order_number, status, total_amount, payment_status …
- **order_items**: id, order_id, product_id, quantity, price …
- **favorites**: id, user_id, product_id
- **site_settings**: key, value (например баннеры главной страницы)

---

## 4. Технологический стек

### Backend
- **Node.js + Express**
- **SQLite** + **knex** (миграции)
- **JWT** аутентификация
- **Multer** для загрузки файлов
- **YooKassa** интеграция платежей

### Frontend
- **React**
- **Redux Toolkit + Redux Persist**
- **React Router**
- **Tailwind CSS**

---

## 5. Описание страниц Frontend

### Публичные страницы
- **Главная (`/`)**: баннеры, предложения дня, преимущества, карта и контакты.
- **Каталог (`/products`)**: список товаров, фильтры, поиск.
- **Карточка товара (`/products/:id`)**: описание, галерея, отзывы.

### Пользовательские страницы
- **Корзина (`/cart`)**: список товаров, суммы, удаление.
- **Оформление заказа (`/checkout`)**: форма адреса, выбор доставки, оплата.
- **Успешный заказ (`/order-success`)**: статус оплаты и заказа.
- **Избранное (`/favorites`)**: сохранённые товары.
- **Профиль (`/profile`)**: данные пользователя, история заказов.

### Админ‑панель
- **Админ (`/admin`)**: управление товарами, категориями, заказами, баннерами.
  - Статистика
  - Список заказов (с возможностью смены статуса)
  - Управление товарами (создание, редактирование, копирование)
  - Категории (дерево, иконки)
  - Баннеры главной страницы

---

## Примечания
- Для работы требуется настроенный `.env` (см. `README.md`).
- Миграции выполняются командой:
  ```bash
  cd backend
  npm run migrate
  ```
