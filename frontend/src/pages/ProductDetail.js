import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProductById, clearCurrentProduct } from '../features/products/productsSlice';
import { fetchReviewsByProduct, clearReviews } from '../features/reviews/reviewsSlice';
import { addToCart } from '../features/cart/cartSlice';
import { StarIcon, TruckIcon, ShieldCheckIcon, ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProduct: product, loading: productLoading, error: productError } = useSelector((state) => state.products);
  const { reviews, ratingStats, loading: reviewsLoading, error: reviewsError } = useSelector((state) => state.reviews);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      dispatch(fetchReviewsByProduct({ productId: id }));
    }

    return () => {
      dispatch(clearCurrentProduct());
      dispatch(clearReviews());
    };
  }, [dispatch, id]);


  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({
        id: product.id,
        name: product.name,
        price: product.currentPrice,
        image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg',
        quantity: quantity
      }));
      // Можно добавить уведомление об успехе
    }
  };

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  if (productLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки товара</h1>
          <p className="text-gray-600 mb-6">{productError}</p>
          <Link
            to="/products"
            className="inline-flex items-center text-primary-600 hover:text-primary-800"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Вернуться к товарам
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Товар не найден</h1>
          <Link
            to="/products"
            className="inline-flex items-center text-primary-600 hover:text-primary-800"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Вернуться к товарам
          </Link>
        </div>
      </div>
    );
  }

  // Обрабатываем изображения (могут приходить как массив или JSON строка)
  let images = [];
  if (product.images) {
    if (Array.isArray(product.images)) {
      images = product.images;
    } else if (typeof product.images === 'string') {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        images = [];
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Навигация */}
      <div className="mb-6">
        <Link
          to="/products"
          className="inline-flex items-center text-primary-600 hover:text-primary-800 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Назад к товарам
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Галерея изображений */}
        <div className="space-y-4">
          {/* Основное изображение */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {images.length > 0 ? (
              <img
                src={`http://localhost:5001${images[selectedImage]}`}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/placeholder.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-6xl">📱</div>
              </div>
            )}
          </div>

          {/* Миниатюры */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={`http://localhost:5001${image}`}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Информация о товаре */}
        <div className="space-y-6">
          {/* Название и рейтинг */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

            {product.averageRating && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(product.averageRating) ? 'text-yellow-400' : 'text-gray-300'}>
                      <StarIconSolid className="h-5 w-5" />
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.averageRating.toFixed(1)} ({product.reviewCount} отзывов)
                </span>
              </div>
            )}
          </div>

          {/* Цена */}
          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-primary-600">
              {product.currentPrice.toLocaleString('ru-RU')} ₽
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-xl text-gray-500 line-through">
                {product.price.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>

          {/* SKU и наличие */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Артикул: {product.sku}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              product.stockStatus === 'in_stock'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {product.stockStatus === 'in_stock' ? 'В наличии' : 'Нет в наличии'}
            </span>
          </div>

          {/* Количество и добавление в корзину */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Количество:</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 text-center min-w-12">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {product.isAvailable ? 'Добавить в корзину' : 'Товар недоступен'}
            </button>
          </div>

          {/* Преимущества */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center space-x-3">
              <TruckIcon className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Бесплатная доставка</h3>
                <p className="text-sm text-gray-600">При заказе от 10 000 ₽</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Гарантия качества</h3>
                <p className="text-sm text-gray-600">12 месяцев официальной гарантии</p>
              </div>
            </div>
          </div>

          {/* Характеристики товара */}
          {product.specifications && typeof product.specifications === 'object' && Object.keys(product.specifications).length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Характеристики товара</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Детальное описание */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Описание */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Описание</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Характеристики */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Характеристики</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="font-medium text-gray-900">Категория:</span>
                <span className="ml-2 text-gray-600">{product.category_name || 'Не указана'}</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="font-medium text-gray-900">Бренд:</span>
                <span className="ml-2 text-gray-600">{product.brand_name || 'Не указан'}</span>
              </div>

              {product.weight && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="font-medium text-gray-900">Вес:</span>
                  <span className="ml-2 text-gray-600">{product.weight} кг</span>
                </div>
              )}

              {product.dimensions && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="font-medium text-gray-900">Размеры:</span>
                  <span className="ml-2 text-gray-600">{product.dimensions}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Отзывы */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Отзывы {ratingStats.totalReviews > 0 && `(${ratingStats.totalReviews})`}
          </h2>

          {reviewsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">{reviewsError}</p>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {/* Общая статистика рейтинга */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {ratingStats.averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIconSolid
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(ratingStats.averageRating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {ratingStats.totalReviews} отзывов
                    </div>
                  </div>
                </div>
              </div>

              {/* Список отзывов */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{review.userName}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.title && (
                      <h3 className="font-medium text-gray-900 mb-2">{review.title}</h3>
                    )}

                    <p className="text-gray-700">{review.comment}</p>

                    {review.isVerified && (
                      <div className="mt-3 flex items-center text-green-600 text-sm">
                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        Проверенный отзыв
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {reviewsLoading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Пока нет отзывов</p>
              <p className="text-sm text-gray-500">Будьте первым, кто оставит отзыв!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
