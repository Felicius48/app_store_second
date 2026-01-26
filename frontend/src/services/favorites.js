import api from './api';

export const fetchFavorites = async () => {
  const res = await api.get('/favorites');
  return res.data?.data?.products || [];
};

export const addFavorite = async (productId) => {
  const res = await api.post('/favorites', { productId });
  return res.data;
};

export const removeFavorite = async (productId) => {
  const res = await api.delete(`/favorites/${productId}`);
  return res.data;
};
