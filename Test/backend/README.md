# Backend Unit Tests

## Структура тестов

```
Test/backend/
├── models/              # Тесты моделей
│   ├── User.test.js
│   ├── Product.test.js
│   ├── Category.test.js
│   ├── Order.test.js
│   ├── Favorite.test.js
│   └── Settings.test.js
├── middleware/          # Тесты middleware
│   └── auth.test.js
├── routes/              # Тесты роутов
│   └── auth.test.js
├── utils/               # Утилиты для тестов
│   └── testUtils.js
└── README.md
```

## Установка зависимостей

```bash
cd backend
npm install --save-dev jest supertest
```

## Настройка Jest

Создайте файл `backend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/Test/backend/**/*.test.js'],
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
```

## Запуск тестов

```bash
cd backend
npm test
```

Запуск с покрытием:
```bash
npm test -- --coverage
```

Запуск конкретного теста:
```bash
npm test -- User.test.js
```

## Покрытие функционала

### Модели
- ✅ User (создание, поиск, обновление, пароли, токены)
- ✅ Product (CRUD, фильтры, slug, категории)
- ✅ Category (CRUD, дерево, транслитерация)
- ✅ Order (создание, статусы, платежи)
- ✅ Favorite (добавление, удаление, список)
- ✅ Settings (get, set, getAll)

### Middleware
- ✅ authenticate (валидация токена, проверка пользователя)
- ✅ requireAdmin (проверка прав администратора)
- ✅ requireOwnerOrAdmin (проверка владельца или админа)
- ✅ optionalAuth (опциональная аутентификация)

### Роуты
- ✅ POST /auth/register (регистрация)
- ✅ POST /auth/login (авторизация)
- ✅ GET /auth/profile (профиль)

## Дополнительные тесты для добавления

- [ ] routes/products.test.js
- [ ] routes/categories.test.js
- [ ] routes/orders.test.js
- [ ] routes/payments.test.js
- [ ] routes/favorites.test.js
- [ ] routes/settings.test.js
- [ ] routes/admin.test.js
- [ ] Интеграционные тесты для полных сценариев

## Моки и утилиты

Все тесты используют утилиты из `utils/testUtils.js`:
- `mockUser`, `mockAdmin` - моковые пользователи
- `mockProduct`, `mockCategory`, `mockOrder` - моковые данные
- `generateToken` - генерация JWT токенов
- `createMockRequest`, `createMockResponse`, `createMockNext` - моки Express

## Примечания

- Все тесты используют моки для базы данных (`config/database.js`)
- JWT токены мокируются через `jsonwebtoken`
- Bcrypt хеширование мокируется через `bcryptjs`
- Для тестирования роутов используется `supertest`
