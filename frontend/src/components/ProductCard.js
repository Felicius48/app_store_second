import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';
import { toggleFavorite } from '../features/favorites/favoritesSlice';
import { HeartIcon as HeartOutlineIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const placeholderImage =
  'https://via.placeholder.com/400x400.png?text=%D0%9D%D0%B5%D1%82+%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const favoritesState = useSelector((state) => state.favorites);
  const favoriteItems = user ? stateSelectorFavoritesByUser(favoritesState, user.id) : [];
  const favoriteIds = favoriteItems.map((item) => item.id);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isFavorite = favoriteIds.includes(product.id);

  const priceValue = product?.currentPrice ?? product?.price;
  const safePrice =
    typeof priceValue === 'number'
      ? priceValue
      : parseFloat(priceValue || 0);
  const installmentPrice = Math.round(safePrice * 1.1);

  const primaryImagePath =
    product?.images && product.images.length > 0 ? product.images[0] : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: safePrice,
        image: primaryImagePath
          ? `http://localhost:5001${primaryImagePath}`
          : placeholderImage,
        quantity: 1,
      }),
    );
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    if (!user?.id) {
      setShowLoginModal(true);
      return;
    }
    dispatch(toggleFavorite({ userId: user.id, product }));
  };

  return (
    <>
      <Link to={`/products/${product.id}`} className="block">
      <div className="h-full bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col">
        {/* Изображение товара */}
        <div className="h-48 md:h-56 bg-gray-100 flex items-center justify-center">
          <img
            src={
              primaryImagePath
                ? `http://localhost:5001${primaryImagePath}`
                : placeholderImage
            }
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.src = placeholderImage;
            }}
          />
        </div>

        {/* Информация о товаре */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[36px]">
            {product.name}
          </h3>

          {/* Цена в рассрочку (+10%) */}
          <div className="text-xs text-gray-600">
            В рассрочку:{' '}
            <span className="font-semibold text-gray-900">
              {installmentPrice.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          {/* Цена товара */}
          <div className="mt-1 text-lg font-bold text-gray-900">
            {safePrice.toLocaleString('ru-RU')} ₽
          </div>

          {/* Кнопки */}
          <div className="mt-4 grid grid-cols-4 gap-2 mt-auto">
            <button
              onClick={handleAddToCart}
              className="col-span-2 bg-primary-600 text-white px-2 py-2 rounded-xl hover:bg-primary-700 transition-colors text-xs font-semibold"
              title="Добавить в корзину"
            >
              В корзину
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`col-span-1 flex items-center justify-center rounded-xl border transition-all duration-200 ${
                isFavorite
                  ? 'border-red-200 bg-red-50 text-red-500 scale-110'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
              type="button"
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-4 w-4" />
              ) : (
                <HeartOutlineIcon className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={(e) => e.preventDefault()}
              className="col-span-1 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
              title="В сравнение"
              type="button"
            >
              <ScaleIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Статус наличия */}
          <div className="mt-3">
            {product.stockStatus === 'in_stock' ? (
              <span className="text-green-600 text-xs">✓ В наличии</span>
            ) : (
              <span className="text-red-600 text-xs">✗ Нет в наличии</span>
            )}
          </div>
        </div>
      </div>
      </Link>
      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Похоже Вы не авторизованы(
            </h3>
            <p className="text-gray-600 mb-6">
              Войдите в аккаунт, чтобы сохранять товары в избранном.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Закрыть
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const stateSelectorFavoritesByUser = (favoritesState, userId) => {
  if (!favoritesState?.itemsByUser || !userId) return [];
  return favoritesState.itemsByUser[String(userId)] || [];
};

export default ProductCard;
