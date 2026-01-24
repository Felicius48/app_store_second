import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [offerProducts, setOfferProducts] = useState([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [banners, setBanners] = useState([]);

  const defaultBanners = useMemo(
    () => [
      {
        title: 'Смартфоны 2026',
        subtitle: 'Топ-модели со скидками до 20%',
        cta: 'Смотреть',
        to: '/products?category=1',
        gradient: 'from-primary-700 via-primary-600 to-primary-500',
        image: '',
      },
      {
        title: 'Ноутбуки для работы',
        subtitle: 'Подборка для учёбы и офиса',
        cta: 'Выбрать',
        to: '/products?search=ноутбук',
        gradient: 'from-slate-800 via-slate-700 to-slate-600',
        image: '',
      },
      {
        title: 'Аксессуары',
        subtitle: 'Наушники, зарядки, чехлы',
        cta: 'Перейти',
        to: '/products?category=4',
        gradient: 'from-primary-900 via-primary-800 to-slate-700',
        image: '',
      },
    ],
    []
  );

  useEffect(() => {
    const loadOfferProducts = async () => {
      setOfferLoading(true);
      try {
        // Пытаемся найти категорию "Предложение дня"
        const categoriesRes = await api.get('/categories');
        const categories = categoriesRes?.data?.data?.categories || [];
        const offerCategory = categories.find(
          (c) => (c?.name || '').toLowerCase() === 'предложение дня'
        );

        // 1) Если есть категория "Предложение дня" — берём товары из неё
        if (offerCategory?.id) {
          const productsRes = await api.get(
            `/products?category=${offerCategory.id}&limit=10&sortBy=created_at&sortOrder=desc`
          );
          setOfferProducts(productsRes?.data?.data?.products || []);
          return;
        }

        // 2) Иначе пробуем featured
        const featuredRes = await api.get('/products?featured=true&limit=10');
        const featured = featuredRes?.data?.data?.products || [];
        if (featured.length > 0) {
          setOfferProducts(featured);
          return;
        }

        // 3) Иначе просто первые 10 товаров
        const fallbackRes = await api.get('/products?limit=10&sortBy=created_at&sortOrder=desc');
        setOfferProducts(fallbackRes?.data?.data?.products || []);
      } catch (e) {
        setOfferProducts([]);
      } finally {
        setOfferLoading(false);
      }
    };

    loadOfferProducts();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('home_banners');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBanners(parsed);
          return;
        }
      } catch (e) {
        // ignore invalid storage
      }
    }
    setBanners(defaultBanners);
  }, [defaultBanners]);

  useEffect(() => {
    setActiveBannerIndex(0);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const intervalId = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [banners.length]);

  const goToBanner = (index) => {
    setActiveBannerIndex(index);
  };

  const goToPrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="space-y-10">
      {/* Баннеры */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-stretch lg:min-h-[360px]">
        {banners.length > 0 && (
          <div className="relative rounded-2xl shadow-md overflow-hidden h-full min-h-[260px] lg:min-h-[360px]">
            <div className="relative h-full">
              {banners.map((banner, index) => (
                <Link
                  key={banner.title}
                  to={banner.to}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === activeBannerIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  aria-hidden={index !== activeBannerIndex}
                >
                  <div className={`h-full w-full bg-gradient-to-br ${banner.gradient} text-white relative`}>
                    {banner.image && (
                      <img
                        src={banner.image.startsWith('http') ? banner.image : `http://localhost:5001${banner.image}`}
                        alt={banner.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-transparent" />
                    <div className="p-8 md:p-10 h-full flex flex-col justify-between">
                      <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-semibold leading-tight">{banner.title}</h2>
                        <p className="mt-3 text-white/90 text-base md:text-lg">{banner.subtitle}</p>
                      </div>
                      <div className="mt-8 relative z-10">
                        <span className="inline-flex items-center gap-2 bg-white text-primary-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-white/95">
                          {banner.cta}
                          <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevBanner}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-9 h-9 flex items-center justify-center shadow"
                  aria-label="Предыдущий баннер"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goToNextBanner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-9 h-9 flex items-center justify-center shadow"
                  aria-label="Следующий баннер"
                >
                  ›
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goToBanner(index)}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        index === activeBannerIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Перейти к баннеру ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 h-full lg:grid-rows-2">
          {banners.slice(1, 3).map((b) => (
            <Link
              key={b.title}
              to={b.to}
              className={`relative overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br ${b.gradient} text-white h-full min-h-[180px]`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${b.gradient}`} />
              {b.image && (
                <img
                  src={b.image.startsWith('http') ? b.image : `http://localhost:5001${b.image}`}
                  alt={b.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-transparent" />
              <div className="relative z-10 p-6 md:p-7 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold leading-tight">{b.title}</h3>
                  <p className="mt-2 text-white/90 text-sm md:text-base">{b.subtitle}</p>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-xl font-semibold hover:bg-white/95 text-sm">
                    {b.cta}
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Предложение дня */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Предложение дня</h2>
          <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium">
            Все товары →
          </Link>
        </div>

        {offerLoading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="animate-pulse h-5 w-48 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        ) : offerProducts.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-2">
            {offerProducts.map((p) => (
              <div key={p.id} className="min-w-[280px] max-w-[280px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-gray-600">
            Пока нет товаров для блока “Предложение дня”.
          </div>
        )}
      </section>

      {/* Преимущества */}
      <section className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">Наши преимущества</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-gray-200 p-6">
            <div className="text-primary-600 text-3xl mb-3">🛍️</div>
            <h3 className="text-lg font-semibold text-gray-900">Широкий ассортимент</h3>
            <p className="mt-2 text-gray-600">Смартфоны, ноутбуки, аксессуары и многое другое.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-6">
            <div className="text-primary-600 text-3xl mb-3">🚚</div>
            <h3 className="text-lg font-semibold text-gray-900">Доставка по всей России</h3>
            <p className="mt-2 text-gray-600">Отправляем быстро и аккуратно, с отслеживанием.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-6">
            <div className="text-primary-600 text-3xl mb-3">🤝</div>
            <h3 className="text-lg font-semibold text-gray-900">Клиентский сервис</h3>
            <p className="mt-2 text-gray-600">Поможем с выбором, оформлением и гарантией.</p>
          </div>
        </div>
      </section>

      {/* Карта + контакты */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden min-h-[360px] h-full">
          <iframe
            title="Карта магазина"
            src="https://yandex.ru/map-widget/v1/?ll=37.617635%2C55.755814&z=12"
            width="100%"
            height="100%"
            frameBorder="0"
            className="w-full h-full"
          />
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Контакты</h2>
          <div className="mt-6 space-y-4 text-gray-700">
            <div>
              <div className="text-sm text-gray-500">Название магазина</div>
              <div className="text-lg font-semibold">iTexnika</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Телефон</div>
              <a className="text-lg font-semibold text-primary-600 hover:text-primary-700" href="tel:+79990000000">
                +7 (999) 000-00-00
              </a>
            </div>
            <div>
              <div className="text-sm text-gray-500">Адрес</div>
              <div className="text-lg font-semibold">г. Москва, ул. Примерная, д. 10</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">График работы</div>
              <div className="text-lg font-semibold">Пн–Вс: 10:00–20:00</div>
            </div>
          </div>
          <div className="mt-8">
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Перейти в каталог
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
