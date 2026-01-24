import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { logout } from '../features/auth/authSlice';
import { fetchCategoryTree } from '../features/categories/categoriesSlice';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const favoritesState = useSelector((state) => state.favorites);
  const { categoryTree } = useSelector((state) => state.categories);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeRootCategoryId, setActiveRootCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0);
  const favoriteCount = user?.id
    ? (favoritesState.itemsByUser?.[String(user.id)] || []).length
    : 0;

  useEffect(() => {
    if (categoryTree.length === 0) {
      dispatch(fetchCategoryTree());
    }
  }, [dispatch, categoryTree.length]);

  useEffect(() => {
    if (isCatalogOpen && categoryTree.length > 0 && !activeRootCategoryId) {
      setActiveRootCategoryId(categoryTree[0].id);
    }
  }, [isCatalogOpen, categoryTree, activeRootCategoryId]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleCatalog = () => {
    setIsCatalogOpen((prev) => !prev);
  };

  const closeCatalog = () => {
    setIsCatalogOpen(false);
  };

  const handleCategorySelect = (categoryId) => {
    navigate(`/products?category=${categoryId}`);
    closeCatalog();
  };

  const activeRootCategory =
    categoryTree.find((cat) => cat.id === activeRootCategoryId) || null;

  const getCategoryIconUrl = (category) => {
    const icon = category.iconUrl || category.sampleImage;
    if (!icon) return null;
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) {
      return icon;
    }
    return `http://localhost:5001${icon}`;
  };

  const renderSubcategoriesGrid = () => {
    if (!activeRootCategory) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Выберите категорию слева
        </div>
      );
    }

    const level2 = activeRootCategory.children || [];

    if (level2.length === 0) {
      return (
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-4">
            {activeRootCategory.name}
          </h3>
          <p className="text-gray-500">
            Для этой категории пока нет подкатегорий. Показать товары категории?
          </p>
          <button
            onClick={() => handleCategorySelect(activeRootCategory.id)}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors w-max"
          >
            Перейти к товарам
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {activeRootCategory.name}
            </h3>
            <p className="text-sm text-gray-500">
              Выберите подкатегорию, чтобы перейти к товарам
            </p>
          </div>
          <button
            onClick={() => handleCategorySelect(activeRootCategory.id)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Все товары раздела
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto pr-2">
          {level2.map((sub) => {
            const iconUrl = getCategoryIconUrl(sub);
            return (
              <div key={sub.id} className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleCategorySelect(sub.id)}
                  className="flex items-center gap-3 text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                    {iconUrl ? (
                      <img src={iconUrl} alt={sub.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm text-gray-400">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {sub.name}
                    </div>
                  </div>
                </button>

                {sub.children && sub.children.length > 0 && (
                  <div className="space-y-2 pl-12">
                    {sub.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategorySelect(child.id);
                        }}
                        className="block text-sm text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Верхняя строка */}
        <div className="flex items-center justify-between h-16">
          {/* Левая часть - Логотип и Каталог */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              TechStore
            </Link>

            {/* Кнопка Каталог */}
            <div className="relative">
              <button
                onClick={toggleCatalog}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors"
              >
                <Bars3Icon className="h-5 w-5" />
                <span className="font-medium">Каталог</span>
              </button>
            </div>
          </div>

          {/* Центральная часть - Поиск */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Правая часть - Корзина и Профиль */}
          <div className="flex items-center space-x-4">
            {/* Избранное */}
            <Link to="/favorites" className="relative text-gray-700 hover:text-primary-600 transition-colors">
              <HeartIcon className={`h-6 w-6 ${favoriteCount > 0 ? 'text-red-500' : ''}`} />
              {favoriteCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {favoriteCount > 99 ? '99+' : favoriteCount}
                </span>
              )}
            </Link>
            {/* Корзина */}
            <Link to="/cart" className="relative text-gray-700 hover:text-primary-600 transition-colors">
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </Link>

            {/* Личный кабинет */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors">
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden sm:inline font-medium">{user.firstName}</span>
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Личный кабинет
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <CogIcon className="h-4 w-4 inline mr-2" />
                      Админ-панель
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors font-medium"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Меню категорий под шапкой */}
      {categoryTree.length > 0 && (
        <div className="border-t border-gray-100 bg-white">
          <div className="container mx-auto px-4">
            <div className="overflow-x-auto">
              <ul className="flex items-center justify-center gap-6 py-3 text-sm whitespace-nowrap">
                {categoryTree.map((category) => (
                  <li key={category.id}>
                    <Link
                      to={`/products?category=${category.id}`}
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Модальное мегаменю каталога */}
      {isCatalogOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={closeCatalog}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <div className="w-[980px] h-[560px] max-w-[95vw] max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex">
              {/* Левая колонка – корневые категории */}
              <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900">
                    Категории товаров
                  </h3>
                  <button
                    onClick={closeCatalog}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="py-2">
                  {categoryTree.length > 0 ? (
                    categoryTree.map((category) => {
                      const isActive = category.id === activeRootCategoryId;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onMouseEnter={() => setActiveRootCategoryId(category.id)}
                          onClick={() => setActiveRootCategoryId(category.id)}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-white text-primary-700 border-l-4 border-primary-500'
                              : 'text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          <span className="truncate">{category.name}</span>
                          <span className="ml-2 text-xs text-gray-400">›</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-sm text-gray-500">
                      Категории загружаются...
                    </div>
                  )}
                </div>
              </div>

              {/* Правая часть – подкатегории 2 и 3 уровней */}
              <div className="flex-1 p-6 overflow-y-auto h-full">
                {renderSubcategoriesGrid()}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
