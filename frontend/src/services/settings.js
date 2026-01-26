import api from './api';

export const fetchBanners = async () => {
  const res = await api.get('/settings/banners');
  return res.data?.data?.banners || [];
};

export const saveBanners = async (banners) => {
  const res = await api.put('/settings/banners', { banners });
  return res.data;
};
