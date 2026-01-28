# Тесты проекта TechStore

## Структура тестов

```
Test/
├── components/          # Frontend: Тесты компонентов
│   ├── Header.test.js
│   └── ProductCard.test.js
├── pages/              # Frontend: Тесты страниц
│   ├── Home.test.js
│   ├── Products.test.js
│   ├── Cart.test.js
│   ├── Checkout.test.js
│   ├── Login.test.js
│   └── Favorites.test.js
├── features/           # Frontend: Тесты Redux slices
│   ├── authSlice.test.js
│   └── cartSlice.test.js
├── integration/        # Frontend: Интеграционные тесты
│   └── checkoutFlow.test.js
├── utils/              # Frontend: Утилиты для тестов
│   └── testUtils.js
├── backend/            # Backend: Unit тесты
│   ├── models/         # Тесты моделей
│   │   ├── User.test.js
│   │   ├── Product.test.js
│   │   ├── Category.test.js
│   │   ├── Order.test.js
│   │   ├── Favorite.test.js
│   │   └── Settings.test.js
│   ├── middleware/     # Тесты middleware
│   │   └── auth.test.js
│   ├── routes/         # Тесты роутов
│   │   └── auth.test.js
│   ├── utils/          # Backend: Утилиты для тестов
│   │   └── testUtils.js
│   └── README.md
└── README.md
```

## Запуск тестов

### Frontend тесты

```bash
cd frontend
npm test
```

Запуск с покрытием:
```bash
npm test -- --coverage
```

Запуск в watch режиме:
```bash
npm test -- --watch
```

### Backend тесты

```bash
cd backend
npm test
```

Запуск с покрытием:
```bash
npm test -- --coverage
```

Запуск в watch режиме:
```bash
npm test -- --watch
```

## Покрытие функционала

### Frontend

#### Компоненты
- ✅ Header (навигация, каталог, корзина, избранное, профиль)
- ✅ ProductCard (отображение, добавление в корзину, избранное)

#### Страницы
- ✅ Home (баннеры, предложения дня, преимущества)
- ✅ Products (список товаров, фильтры, поиск)
- ✅ Cart (отображение, изменение количества, удаление, очистка)
- ✅ Checkout (форма, валидация, создание заказа)
- ✅ Login (форма, валидация, авторизация)
- ✅ Favorites (список, удаление, очистка)

#### Redux Slices
- ✅ cartSlice (добавление, удаление, обновление количества, очистка)
- ✅ authSlice (логин, регистрация, профиль, логаут)

#### Интеграционные тесты
- ✅ Полный флоу оформления заказа

### Backend

#### Модели
- ✅ User (создание, поиск, обновление, пароли, токены)
- ✅ Product (CRUD, фильтры, slug, категории)
- ✅ Category (CRUD, дерево, транслитерация)
- ✅ Order (создание, статусы, платежи)
- ✅ Favorite (добавление, удаление, список)
- ✅ Settings (get, set, getAll)

#### Middleware
- ✅ authenticate (валидация токена, проверка пользователя)
- ✅ requireAdmin (проверка прав администратора)
- ✅ requireOwnerOrAdmin (проверка владельца или админа)
- ✅ optionalAuth (опциональная аутентификация)

#### Роуты
- ✅ POST /auth/register (регистрация)
- ✅ POST /auth/login (авторизация)
- ✅ GET /auth/profile (профиль)

## Дополнительные тесты для добавления

- [ ] ProductDetail (детальная страница товара)
- [ ] Register (регистрация)
- [ ] Profile (профиль, редактирование адреса)
- [ ] OrderSuccess (страница успешного заказа)
- [ ] AdminDashboard (админ-панель)
- [ ] favoritesSlice (Redux)
- [ ] productsSlice (Redux)
- [ ] categoriesSlice (Redux)
- [ ] ordersSlice (Redux)

## Моки и утилиты

### Frontend
Все frontend тесты используют утилиты из `utils/testUtils.js`:
- `renderWithProviders` - рендеринг с Redux и Router
- `createTestStore` - создание тестового store
- Моковые данные (mockUser, mockProduct, mockCategory, mockOrder)

### Backend
Все backend тесты используют утилиты из `backend/utils/testUtils.js`:
- `createMockRequest`, `createMockResponse`, `createMockNext` - моки Express
- `generateToken` - генерация JWT токенов
- Моковые данные (mockUser, mockAdmin, mockProduct, mockCategory, mockOrder)

## Установка зависимостей

### Frontend
Зависимости уже установлены (Jest и React Testing Library включены в react-scripts).

### Backend
```bash
cd backend
npm install --save-dev jest supertest
```
