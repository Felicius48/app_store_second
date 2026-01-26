import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as favoritesApi from '../../services/favorites';

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

export const loadFavorites = createAsyncThunk(
  'favorites/loadFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const products = await favoritesApi.fetchFavorites();
      return products;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки избранного');
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async ({ product }, { rejectWithValue }) => {
    try {
      await favoritesApi.addFavorite(product.id);
      return normalizeProduct(product);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка добавления в избранное');
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async ({ productId }, { rejectWithValue }) => {
    try {
      await favoritesApi.removeFavorite(productId);
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления из избранного');
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        const item = action.payload;
        if (!item) return;
        if (!state.items.find((p) => p.id === item.id)) {
          state.items.push(item);
        }
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
