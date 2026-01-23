import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../features/products/productsSlice';
import { fetchCategories, fetchCategoryTree } from '../features/categories/categoriesSlice';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const { categoryTree } = useSelector((state) => state.categories);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
    specs: {} // фильтры по характеристикам: { [ключ]: Set/массив значений }
  });

  useEffect(() => {
    // Загружаем дерево категорий при первой загрузке
    if (!categoryTree || categoryTree.length === 0) {
      dispatch(fetchCategoryTree());
    }
  }, [dispatch, categoryTree]);

  useEffect(() => {
    // Синхронизируем фильтры с URL параметрами при первой загрузке
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    setFilters(prev => ({
      ...prev,
      search,
      category
    }));
  }, [searchParams]);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // Обновляем URL параметры для search и category
    const params = new URLSearchParams();
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    if (updatedFilters.category) params.set('category', updatedFilters.category);

    setSearchParams(params);
  };

  const renderCategoryOptions = (categories, level = 0) => {
    return categories.map((category) => (
      <React.Fragment key={category.id}>
        <option value={category.id}>
          {'  '.repeat(level)}{level > 0 ? '└ ' : ''}{category.name}
        </option>
        {category.children && category.children.length > 0 && (
          renderCategoryOptions(category.children, level + 1)
        )}
      </React.Fragment>
    ));
  };

  // Доступные характеристики на основе загруженных товаров
  const availableSpecs = React.useMemo(() => {
    const specsMap = {};
    products.forEach((product) => {
      if (product.specifications && typeof product.specifications === 'object') {
        Object.entries(product.specifications).forEach(([key, value]) => {
          if (!specsMap[key]) {
            specsMap[key] = new Set();
          }
          specsMap[key].add(String(value));
        });
      }
    });
    // Преобразуем Set в массив для удобства рендера
    const result = {};
    Object.entries(specsMap).forEach(([key, set]) => {
      result[key] = Array.from(set);
    });
    return result;
  }, [products]);

  // Применяем клиентские фильтры по характеристикам
  const filteredProducts = React.useMemo(() => {
    const activeSpecs = filters.specs || {};
    const activeSpecKeys = Object.keys(activeSpecs).filter(
      (key) => Array.isArray(activeSpecs[key]) && activeSpecs[key].length > 0
    );

    if (activeSpecKeys.length === 0) {
      return products;
    }

    return products.filter((product) => {
      const specs = product.specifications || {};
      return activeSpecKeys.every((key) => {
        const values = activeSpecs[key];
        const productValue = specs[key];
        return productValue !== undefined && values.includes(String(productValue));
      });
    });
  }, [products, filters.specs]);

  const handleSpecFilterChange = (key, value, checked) => {
    setFilters((prev) => {
      const currentSpecs = { ...(prev.specs || {}) };
      const currentValues = new Set(currentSpecs[key] || []);
      if (checked) {
        currentValues.add(value);
      } else {
        currentValues.delete(value);
      }
      currentSpecs[key] = Array.from(currentValues);
      return {
        ...prev,
        specs: currentSpecs,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Ошибка загрузки товаров: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Каталог товаров</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Центральная область – товары */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Товары не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка – фильтры */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            {/* Поиск и категория */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Фильтры</h2>
              <input
                type="text"
                placeholder="Поиск товаров..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
              />

              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
              >
                <option value="">Все категории</option>
                {renderCategoryOptions(categoryTree)}
              </select>
            </div>

            {/* Фильтр по цене */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Цена</h3>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="от"
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="до"
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
                />
              </div>
            </div>

            {/* Фильтры по характеристикам */}
            {Object.keys(availableSpecs).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Характеристики</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {Object.entries(availableSpecs).map(([key, values]) => (
                    <div key={key} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        {key}
                      </p>
                      <div className="space-y-1">
                        {values.map((value) => {
                          const checked =
                            filters.specs?.[key]?.includes(value) || false;
                          return (
                            <label key={value} className="flex items-center text-xs text-gray-700">
                              <input
                                type="checkbox"
                                className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                checked={checked}
                                onChange={(e) =>
                                  handleSpecFilterChange(key, value, e.target.checked)
                                }
                              />
                              <span className="truncate">{value}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
