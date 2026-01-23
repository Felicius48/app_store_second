import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProductCard from '../components/ProductCard';
import { clearFavorites } from '../features/favorites/favoritesSlice';

const Favorites = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const favoritesState = useSelector((state) => state.favorites);
  const items = user?.id ? favoritesState.itemsByUser?.[String(user.id)] || [] : [];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Избранное</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Войдите в аккаунт, чтобы видеть список избранных товаров
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Избранное пусто</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Добавьте товары в избранное, чтобы быстро находить их позже
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Перейти к товарам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Избранное</h1>
        <button
          onClick={() => dispatch(clearFavorites({ userId: user.id }))}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Очистить список
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Favorites;
