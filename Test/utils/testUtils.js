import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from '../../frontend/src/features/auth/authSlice';
import productsReducer from '../../frontend/src/features/products/productsSlice';
import cartReducer from '../../frontend/src/features/cart/cartSlice';
import categoriesReducer from '../../frontend/src/features/categories/categoriesSlice';
import reviewsReducer from '../../frontend/src/features/reviews/reviewsSlice';
import ordersReducer from '../../frontend/src/features/orders/ordersSlice';
import favoritesReducer from '../../frontend/src/features/favorites/favoritesSlice';

// Создание тестового store
export function createTestStore(initialState = {}) {
  const rootReducer = combineReducers({
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    favorites: favoritesReducer,
    categories: categoriesReducer,
    reviews: reviewsReducer,
    orders: ordersReducer,
  });

  return configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
  });
}

// Обертка для рендеринга с провайдерами
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Моковые данные
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
};

export const mockAdmin = {
  id: 2,
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
};

export const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 1000,
  currentPrice: 1000,
  images: ['/uploads/test.jpg'],
  stockStatus: 'in_stock',
  stockQuantity: 10,
  sku: 'TEST-001',
  description: 'Test description',
  isAvailable: true,
};

export const mockCategory = {
  id: 1,
  name: 'Test Category',
  slug: 'test-category',
  parentId: null,
};

export const mockOrder = {
  id: 1,
  orderNumber: 'ORD-123',
  status: 'pending',
  paymentStatus: 'pending',
  totalAmount: 1000,
  items: [
    {
      id: 1,
      productName: 'Test Product',
      quantity: 1,
      price: 1000,
      total: 1000,
    },
  ],
};
