import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Асинхронные действия
export const fetchReviewsByProduct = createAsyncThunk(
  'reviews/fetchReviewsByProduct',
  async ({ productId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/product/${productId}?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки отзывов');
    }
  }
);

export const createReview = createAsyncThunk(
  'reviews/createReview',
  async ({ productId, rating, title, comment }, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews', { productId, rating, title, comment });
      return response.data.data.review;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания отзыва');
    }
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    pagination: {
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    },
    ratingStats: {
      averageRating: 0,
      totalReviews: 0
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearReviews: (state) => {
      state.reviews = [];
      state.pagination = {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reviews
      .addCase(fetchReviewsByProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviewsByProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews;
        state.ratingStats = action.payload.ratingStats;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReviewsByProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews.unshift(action.payload); // Добавляем новый отзыв в начало
        state.ratingStats.totalReviews += 1;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearReviews } = reviewsSlice.actions;
export default reviewsSlice.reducer;
