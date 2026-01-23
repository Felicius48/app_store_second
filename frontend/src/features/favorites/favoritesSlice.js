import { createSlice } from '@reduxjs/toolkit';

const normalizeProduct = (product) => {
  if (!product) return null;
  const images = Array.isArray(product.images)
    ? product.images
    : typeof product.images === 'string'
      ? (() => {
          try {
            return JSON.parse(product.images);
          } catch (e) {
            return [];
          }
        })()
      : [];

  return {
    id: product.id,
    name: product.name,
    price: product.currentPrice ?? product.price,
    images,
    stockStatus: product.stockStatus,
  };
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    itemsByUser: {},
  },
  reducers: {
    toggleFavorite: (state, action) => {
      const { userId, product } = action.payload || {};
      if (!userId) return;
      ensureItemsByUserState(state, userId);
      const normalized = normalizeProduct(product);
      if (!normalized?.id) return;

      const userKey = String(userId);
      if (!state.itemsByUser[userKey]) {
        state.itemsByUser[userKey] = [];
      }

      const existingIndex = state.itemsByUser[userKey].findIndex(
        (item) => item.id === normalized.id
      );
      if (existingIndex >= 0) {
        state.itemsByUser[userKey].splice(existingIndex, 1);
      } else {
        state.itemsByUser[userKey].push(normalized);
      }
    },
    removeFavorite: (state, action) => {
      const { userId, id } = action.payload || {};
      if (!userId) return;
      ensureItemsByUserState(state, userId);
      const userKey = String(userId);
      if (!state.itemsByUser[userKey]) return;
      state.itemsByUser[userKey] = state.itemsByUser[userKey].filter((item) => item.id !== id);
    },
    clearFavorites: (state, action) => {
      const { userId } = action.payload || {};
      if (!userId) return;
      ensureItemsByUserState(state, userId);
      const userKey = String(userId);
      state.itemsByUser[userKey] = [];
    },
  },
});

export const { toggleFavorite, removeFavorite, clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;

const ensureItemsByUserState = (state, userId) => {
  if (!state.itemsByUser) {
    state.itemsByUser = {};
  }

  const userKey = String(userId);
  if (!state.itemsByUser[userKey]) {
    state.itemsByUser[userKey] = [];
  }

  if (Array.isArray(state.items) && state.items.length > 0) {
    state.itemsByUser[userKey] = state.itemsByUser[userKey].length > 0
      ? state.itemsByUser[userKey]
      : state.items;
    delete state.items;
  }
};
