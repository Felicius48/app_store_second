import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

// Импортируем редьюсеры
import authReducer from '../features/auth/authSlice';
import productsReducer from '../features/products/productsSlice';
import cartReducer from '../features/cart/cartSlice';
import categoriesReducer from '../features/categories/categoriesSlice';
import reviewsReducer from '../features/reviews/reviewsSlice';
import ordersReducer from '../features/orders/ordersSlice';
import favoritesReducer from '../features/favorites/favoritesSlice';

// Конфигурация persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'cart', 'favorites'] // Только эти редьюсеры будут сохраняться
};

// Комбинируем редьюсеры
const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  cart: cartReducer,
  favorites: favoritesReducer,
  categories: categoriesReducer,
  reviews: reviewsReducer,
  orders: ordersReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Создаем store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
