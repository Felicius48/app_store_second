import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChartBarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PhotoIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { fetchCategories, fetchCategoryTree } from '../features/categories/categoriesSlice';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { categories, categoryTree } = useSelector((state) => state.categories);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    categoryIds: [],
    brandId: '',
    stockQuantity: '',
    sku: '',
    images: [],
    specifications: {}
  });
  const [specificationsList, setSpecificationsList] = useState([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedProductCategoryIds, setExpandedProductCategoryIds] = useState(new Set());
  const [bannerSettings, setBannerSettings] = useState([]);
  const [uploadingBannerIndex, setUploadingBannerIndex] = useState(null);
  const [bannerSaveMessage, setBannerSaveMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    iconUrl: '',
    parentId: ''
  });

  useEffect(() => {
    if (categoryTree.length === 0) {
      dispatch(fetchCategoryTree());
    }
    loadDashboardStats();
  }, [dispatch, categoryTree.length]);

  useEffect(() => {
    const defaultBannerSettings = [
      {
        title: 'Смартфоны 2026',
        subtitle: 'Топ-модели со скидками до 20%',
        cta: 'Смотреть',
        to: '/products?category=1',
        gradient: 'from-primary-700 via-primary-600 to-primary-500',
        image: ''
      },
      {
        title: 'Ноутбуки для работы',
        subtitle: 'Подборка для учёбы и офиса',
        cta: 'Выбрать',
        to: '/products?search=ноутбук',
        gradient: 'from-slate-800 via-slate-700 to-slate-600',
        image: ''
      },
      {
        title: 'Аксессуары',
        subtitle: 'Наушники, зарядки, чехлы',
        cta: 'Перейти',
        to: '/products?category=4',
        gradient: 'from-primary-900 via-primary-800 to-slate-700',
        image: ''
      }
    ];

    const stored = localStorage.getItem('home_banners');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBannerSettings(parsed);
          return;
        }
      } catch (e) {
        // ignore invalid storage
      }
    }
    setBannerSettings(defaultBannerSettings);
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    }
  }, [activeTab, selectedCategoryId]);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/orders/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
    setLoading(false);
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        await loadOrders();
      } else {
        alert(data.message || 'Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса заказа:', error);
      alert('Произошла ошибка при обновлении статуса заказа');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId);
      }

      const response = await fetch(`http://localhost:5001/api/admin/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    }
    setLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'orders' && orders.length === 0) {
      loadOrders();
    } else if (tab === 'products' && products.length === 0) {
      loadProducts();
    }
  };

  const handleBannerFieldChange = (index, field, value) => {
    setBannerSettings((prev) =>
      prev.map((banner, i) => (i === index ? { ...banner, [field]: value } : banner))
    );
  };

  const handleBannerImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingBannerIndex(index);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const response = await fetch('http://localhost:5001/api/products/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success && data.data?.images?.length > 0) {
        const imagePath = data.data.images[0];
        setBannerSettings((prev) =>
          prev.map((banner, i) => (i === index ? { ...banner, image: imagePath } : banner))
        );
      } else {
        alert(data.message || 'Ошибка загрузки изображения');
      }
    } catch (error) {
      console.error('Ошибка загрузки баннера:', error);
      alert('Произошла ошибка при загрузке изображения');
    } finally {
      setUploadingBannerIndex(null);
    }
  };

  const handleBannerSave = () => {
    localStorage.setItem('home_banners', JSON.stringify(bannerSettings));
    setBannerSaveMessage('Баннеры сохранены');
    setTimeout(() => setBannerSaveMessage(''), 3000);
  };

  const handleBannerReset = () => {
    localStorage.removeItem('home_banners');
    setBannerSaveMessage('Настройки сброшены');
    window.location.reload();
  };

  const handleCategoryIconUpload = async (file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('images', file);
      const response = await fetch('http://localhost:5001/api/products/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success && data.data?.images?.length > 0) {
        setCategoryForm((prev) => ({ ...prev, iconUrl: data.data.images[0] }));
      } else {
        alert(data.message || 'Ошибка загрузки иконки');
      }
    } catch (error) {
      console.error('Ошибка загрузки иконки категории:', error);
      alert('Произошла ошибка при загрузке иконки');
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/orders/admin/all?orderId=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success && data.data.orders.length > 0) {
        setSelectedOrder(data.data.orders[0]);
        setShowOrderModal(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей заказа:', error);
    }
  };

  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleProductCategoryExpansion = (categoryId) => {
    setExpandedProductCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    loadProducts(); // Перезагрузить товары с новым фильтром
  };

  const getFilteredProducts = () => {
    if (!selectedCategoryId) {
      return products;
    }

    // Фильтруем товары по выбранной категории и ее подкатегориям
    const selectedCategory = findCategoryById(categoryTree, selectedCategoryId);
    if (!selectedCategory) {
      return products;
    }

    const categoryIds = [selectedCategoryId];
    const addSubcategoryIds = (category) => {
      if (category.children) {
        category.children.forEach(child => {
          categoryIds.push(child.id);
          addSubcategoryIds(child);
        });
      }
    };
    addSubcategoryIds(selectedCategory);

    return products.filter(product => categoryIds.includes(product.categoryId));
  };

  const findCategoryById = (categories, id) => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleImageUpload = async (files) => {
    if (files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('http://localhost:5001/api/products/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setProductForm(prev => ({
          ...prev,
          images: [...(prev.images || []), ...data.data.images]
        }));
      } else {
        alert('Ошибка загрузки изображений');
      }
    } catch (error) {
      console.error('Ошибка загрузки изображений:', error);
      alert('Произошла ошибка при загрузке изображений');
    }
  };

  const removeImage = (index) => {
    setProductForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecificationsList(prev => [...prev, { key: newSpecKey.trim(), value: newSpecValue.trim() }]);
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (index) => {
    setSpecificationsList(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecifications = () => {
    const specs = {};
    specificationsList.forEach(spec => {
      specs[spec.key] = spec.value;
    });
    setProductForm(prev => ({ ...prev, specifications: specs }));
  };

  const openCreateCategory = (parentId = null) => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      imageUrl: '',
      iconUrl: '',
      parentId: parentId || ''
    });
    setShowCategoryForm(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      iconUrl: category.iconUrl || '',
      parentId: category.parentId || ''
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Удалить категорию "${category.name}"? Если у нее есть подкатегории или товары, операция может быть отклонена.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert('Категория удалена');
        dispatch(fetchCategoryTree());
      } else {
        alert(data.message || 'Ошибка удаления категории');
      }
    } catch (error) {
      console.error('Ошибка удаления категории:', error);
      alert('Произошла ошибка при удалении категории');
    }
  };

  const handleSaveCategory = async () => {
    const name = (categoryForm.name || '').trim();
    if (!name) {
      alert('Название категории обязательно');
      return;
    }

    const description = (categoryForm.description || '').trim();
    const imageUrl = (categoryForm.imageUrl || '').trim();
    const iconUrl = (categoryForm.iconUrl || '').trim();
    const rawParentId = categoryForm.parentId !== null && categoryForm.parentId !== undefined
      ? String(categoryForm.parentId).trim()
      : '';

    let parentIdValue = null;
    if (rawParentId !== '') {
      const parsed = parseInt(rawParentId, 10);
      if (!Number.isFinite(parsed)) {
        alert('ID родительской категории должен быть числом');
        return;
      }
      parentIdValue = parsed;
    }

    const payload = {
      name,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      iconUrl: iconUrl || undefined,
      parentId: parentIdValue !== null ? parentIdValue : undefined
    };

    try {
      const url = editingCategory
        ? `http://localhost:5001/api/categories/${editingCategory.id}`
        : 'http://localhost:5001/api/categories';

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        alert(editingCategory ? 'Категория обновлена' : 'Категория создана');
        setShowCategoryForm(false);
        setEditingCategory(null);
        setCategoryForm({
          name: '',
          description: '',
          imageUrl: '',
          parentId: ''
        });
        dispatch(fetchCategoryTree());
      } else {
        alert(data.message || 'Ошибка сохранения категории');
      }
    } catch (error) {
      console.error('Ошибка сохранения категории:', error);
      alert('Произошла ошибка при сохранении категории');
    }
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = selectedCategoryId === category.id;

      return (
        <div key={category.id}>
          <div
            className={`flex items-center py-2 px-3 rounded-md ${
              isSelected ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategoryExpansion(category.id);
                }}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-8" />
            )}
            <button
              type="button"
              className="flex-1 text-left font-medium"
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.name}
            </button>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => openCreateCategory(category.id)}
                className="p-1 text-gray-500 hover:text-primary-600"
                title="Добавить подкатегорию"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openEditCategory(category)}
                className="p-1 text-gray-500 hover:text-primary-600"
                title="Редактировать категорию"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(category)}
                className="p-1 text-gray-500 hover:text-red-600"
                title="Удалить категорию"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div>
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
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

  // Компонент для чекбоксов категорий
  const CategoryCheckbox = ({ category, selectedIds, onChange, level = 0 }) => {
    const isChecked = selectedIds.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedProductCategoryIds.has(category.id);

    return (
      <div>
        <label className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onChange(category.id, e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 flex-1" style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && '└ '}
            {category.name}
          </span>
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleProductCategoryExpansion(category.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </label>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children.map((child) => (
              <CategoryCheckbox
                key={child.id}
                category={child}
                selectedIds={selectedIds}
                onChange={onChange}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);

    // Гарантируем, что images всегда является массивом
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

    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      categoryId: product.categoryId || '',
      categoryIds: product.categoryIds || (product.categoryId ? [product.categoryId] : []),
      brandId: product.brandId || '',
      stockQuantity: product.stockQuantity || '',
      sku: product.sku || '',
      images: images,
      specifications: product.specifications || {}
    });

    // Загружаем характеристики в список для редактирования
    const specs = product.specifications || {};
    const specsList = Object.entries(specs).map(([key, value]) => ({ key, value }));
    setSpecificationsList(specsList);

    setShowProductForm(true);
  };

  const handleSaveProduct = async () => {
    // Формируем характеристики напрямую из specificationsList
    const specs = {};
    specificationsList.forEach(spec => {
      if (spec.key && spec.value) {
        specs[spec.key] = spec.value;
      }
    });

    // Преобразуем числовые поля в числа
    const formData = { 
      ...productForm,
      price: productForm.price ? parseFloat(productForm.price) : null,
      stockQuantity: productForm.stockQuantity ? parseInt(productForm.stockQuantity, 10) : null,
      categoryId: productForm.categoryId ? parseInt(productForm.categoryId, 10) : null,
      categoryIds: productForm.categoryIds && productForm.categoryIds.length > 0 
        ? productForm.categoryIds.map(id => parseInt(id, 10))
        : (productForm.categoryId ? [parseInt(productForm.categoryId, 10)] : []),
      brandId: productForm.brandId ? parseInt(productForm.brandId, 10) : null,
      specifications: specs  // Используем характеристики из списка напрямую
    };

    try {
      const url = editingProduct
        ? `http://localhost:5001/api/products/${editingProduct.id}`
        : 'http://localhost:5001/api/products';

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(editingProduct ? 'Товар обновлен!' : 'Товар создан!');
        setShowProductForm(false);
        setEditingProduct(null);
        loadProducts();
        setProductForm({
          name: '',
          description: '',
          price: '',
          categoryId: '',
          categoryIds: [],
          brandId: '',
          stockQuantity: '',
          sku: '',
          images: [],
          specifications: {}
        });
        setSpecificationsList([]);
        setNewSpecKey('');
        setNewSpecValue('');
      } else {
        alert(data.message || 'Ошибка сохранения товара');
      }
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
      alert('Произошла ошибка при сохранении товара');
    }
  };

  const handleDuplicateProduct = (product) => {
    const ensureArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return [];
        }
      }
      return [];
    };

    const generateSku = (baseSku, productId) => {
      const sanitized = String(baseSku || '').trim().replace(/\s+/g, '-').toUpperCase();
      const suffix = `${Date.now().toString(36).toUpperCase()}${productId ? `-${productId}` : ''}`;
      if (!sanitized) return `SKU-${suffix}`;
      return `${sanitized}-COPY-${suffix}`;
    };

    setEditingProduct(null);
    setProductForm({
      name: `${product.name || 'Товар'} (копия)`,
      description: product.description || '',
      price: product.price || '',
      categoryId: product.categoryId || '',
      categoryIds: product.categoryIds || (product.categoryId ? [product.categoryId] : []),
      brandId: product.brandId || '',
      stockQuantity: product.stockQuantity || '',
      sku: generateSku(product.sku, product.id),
      images: ensureArray(product.images),
      specifications: product.specifications || {}
    });

    const specs = product.specifications || {};
    const specsList = Object.entries(specs).map(([key, value]) => ({ key, value }));
    setSpecificationsList(specsList);
    setShowProductForm(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Обзор</h2>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Пользователи</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingBagIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Товары</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Заказы</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Категории</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCategories || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Заказы</h2>
        <button
          onClick={loadOrders}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Обновить
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер заказа
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.totalAmount?.toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="pending">Ожидает подтверждения</option>
                        <option value="processing">Подтвержден</option>
                      </select>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.statusText}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                      title="Просмотреть детали заказа"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );


  const renderProducts = () => {
    const filteredProducts = getFilteredProducts();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Товары</h2>
          <div className="flex space-x-3">
            <button
              onClick={loadProducts}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Обновить
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Добавить товар
            </button>
          </div>
        </div>

        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Левая панель - дерево категорий */}
          <div className="w-80 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Категории</h3>

            {/* Кнопка "Все товары" */}
            <div
              className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 rounded-md mb-2 ${
                selectedCategoryId === null ? 'bg-primary-100 text-primary-700' : 'text-gray-700'
              }`}
              onClick={() => handleCategorySelect(null)}
            >
              <span className="font-medium">Все товары</span>
              <span className="ml-auto text-sm text-gray-500">({products.length})</span>
            </div>

            {/* Дерево категорий */}
            <div className="space-y-1">
              {renderCategoryTree(categoryTree)}
            </div>
          </div>

          {/* Правая панель - таблица товаров */}
          <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCategoryId
                    ? `Товары категории: ${findCategoryById(categoryTree, selectedCategoryId)?.name || 'Неизвестная категория'}`
                    : 'Все товары'
                  }
                </h3>
                <span className="text-sm text-gray-600">
                  Показано: {filteredProducts.length} товаров
                </span>
              </div>
            </div>

            <div className="overflow-y-auto h-full">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    {selectedCategoryId
                      ? 'В выбранной категории нет товаров'
                      : 'Товары не найдены'
                    }
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Изображение
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Название
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Цена
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Категория
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Склад
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={product.images && product.images[0] ? `http://localhost:5001${product.images[0]}` : '/placeholder.jpg'}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => e.target.src = '/placeholder.jpg'}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.price?.toLocaleString('ru-RU')} ₽
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            const category = findCategoryById(categoryTree, product.categoryId);
                            return category ? category.name : 'Неизвестная';
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stockQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Редактировать товар"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(product)}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="Создать копию"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900" title="Просмотреть товар">
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBanners = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Баннеры главной страницы</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBannerReset}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Сбросить
          </button>
          <button
            onClick={handleBannerSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Сохранить
          </button>
        </div>
      </div>

      {bannerSaveMessage && (
        <div className="text-sm text-green-600">{bannerSaveMessage}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {bannerSettings.map((banner, index) => (
          <div key={`${banner.title}-${index}`} className="bg-white rounded-lg shadow-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Баннер {index + 1}</h3>
            </div>

            <div className="border border-dashed border-gray-300 rounded-lg overflow-hidden">
              <div className="relative h-40 bg-gray-50">
                {banner.image ? (
                  <img
                    src={banner.image.startsWith('http') ? banner.image : `http://localhost:5001${banner.image}`}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                    Нет изображения
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <label className="text-primary-600 hover:text-primary-700 text-sm font-medium cursor-pointer">
                  {uploadingBannerIndex === index ? 'Загрузка...' : 'Загрузить изображение'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBannerIndex === index}
                    onChange={(e) => handleBannerImageUpload(index, e.target.files?.[0])}
                  />
                </label>
                {banner.image && (
                  <button
                    type="button"
                    onClick={() => handleBannerFieldChange(index, 'image', '')}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                <input
                  type="text"
                  value={banner.title}
                  onChange={(e) => handleBannerFieldChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
                <input
                  type="text"
                  value={banner.subtitle}
                  onChange={(e) => handleBannerFieldChange(index, 'subtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Текст кнопки</label>
                <input
                  type="text"
                  value={banner.cta}
                  onChange={(e) => handleBannerFieldChange(index, 'cta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                <input
                  type="text"
                  value={banner.to}
                  onChange={(e) => handleBannerFieldChange(index, 'to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Админ-панель</h1>
            <div className="flex space-x-1">
              {[
                { id: 'dashboard', label: 'Обзор', icon: ChartBarIcon },
                { id: 'orders', label: 'Заказы', icon: ClipboardDocumentListIcon },
                { id: 'products', label: 'Товары', icon: ShoppingBagIcon },
                { id: 'banners', label: 'Баннеры', icon: PhotoIcon },
                { id: 'categories', label: 'Категории', icon: ChartBarIcon },
                { id: 'users', label: 'Пользователи', icon: UsersIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'banners' && renderBanners()}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Категории</h2>
              <button
                onClick={() => openCreateCategory(null)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Создать корневую категорию
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Дерево категорий</h3>
              {categoryTree.length === 0 ? (
                <p className="text-sm text-gray-500">Категории не загружены или отсутствуют.</p>
              ) : (
                <div className="space-y-1">
                  {renderCategoryTree(categoryTree)}
                </div>
              )}
              <p className="mt-4 text-sm text-gray-500">
                Используйте кнопки рядом с каждой категорией для создания подкатегории, редактирования или удаления.
              </p>
            </div>
          </div>
        )}
        {activeTab === 'users' && (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Управление пользователями</h2>
            <p className="text-gray-600">Функционал находится в разработке</p>
          </div>
        )}
      </div>

      {/* Форма товара */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
                </h3>
                <button
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Основная информация */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название товара
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Цена (₽)
                    </label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Категории (можно выбрать несколько)
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                      {categoryTree.length === 0 ? (
                        <div className="text-sm text-gray-500">Загрузка категорий...</div>
                      ) : (
                        <div className="space-y-2">
                          {categoryTree.map((category) => (
                            <CategoryCheckbox
                              key={category.id}
                              category={category}
                              selectedIds={productForm.categoryIds || []}
                              onChange={(categoryId, checked) => {
                                const currentIds = productForm.categoryIds || [];
                                if (checked) {
                                  setProductForm({
                                    ...productForm,
                                    categoryIds: [...currentIds, categoryId],
                                    categoryId: categoryId // Для обратной совместимости
                                  });
                                } else {
                                  setProductForm({
                                    ...productForm,
                                    categoryIds: currentIds.filter(id => id !== categoryId),
                                    categoryId: currentIds.filter(id => id !== categoryId)[0] || ''
                                  });
                                }
                              }}
                              level={0}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {productForm.categoryIds && productForm.categoryIds.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        Выбрано категорий: {productForm.categoryIds.length}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Количество на складе
                    </label>
                    <input
                      type="number"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({...productForm, stockQuantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Изображения товара */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изображения товара (до 5 фото)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="flex flex-wrap gap-4 mb-4">
                      {Array.isArray(productForm.images) && productForm.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.startsWith('/') ? `http://localhost:5001${image}` : image}
                            alt={`Изображение ${index + 1}`}
                            className="w-24 h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {Array.isArray(productForm.images) && productForm.images.length < 5 && (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                          <label className="cursor-pointer text-gray-400">
                            <PlusIcon className="w-8 h-8" />
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e.target.files)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Нажмите на иконку плюса или перетащите изображения сюда
                    </p>
                  </div>
                </div>

                {/* Характеристики товара */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Характеристики товара
                  </label>

                  {/* Добавление новой характеристики */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Название характеристики"
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Значение"
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={addSpecification}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Список характеристик */}
                  <div className="space-y-2">
                    {specificationsList.map((spec, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">{spec.key}:</span>
                        <span className="text-gray-900">{spec.value}</span>
                        <button
                          type="button"
                          onClick={() => removeSpecification(index)}
                          className="ml-auto text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {specificationsList.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      Нет добавленных характеристик
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingProduct ? 'Сохранить изменения' : 'Создать товар'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Форма категории */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
                </h3>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название категории
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Родительская категория
                  </label>
                  <select
                    value={categoryForm.parentId}
                    onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Без родителя (корневая)</option>
                    {renderCategoryOptions(categoryTree)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL изображения (опционально)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.imageUrl}
                    onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Иконка категории (опционально)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {categoryForm.iconUrl ? (
                        <img
                          src={categoryForm.iconUrl.startsWith('http') ? categoryForm.iconUrl : `http://localhost:5001${categoryForm.iconUrl}`}
                          alt="Иконка категории"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <PhotoIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <label className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                      Загрузить иконку
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCategoryIconUpload(e.target.files?.[0])}
                      />
                    </label>
                    {categoryForm.iconUrl && (
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, iconUrl: '' })}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingCategory ? 'Сохранить изменения' : 'Создать категорию'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно деталей заказа */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Заказ #{selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Информация о заказе */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Информация о заказе</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Номер заказа:</span>
                        <span className="font-medium">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Дата создания:</span>
                        <span className="font-medium">{selectedOrder.createdAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Статус:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.statusText}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Сумма:</span>
                        <span className="font-bold text-lg">{selectedOrder.totalAmount?.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    </div>
                  </div>

                  {/* Информация о клиенте */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Информация о клиенте</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Имя:</span>
                        <span className="font-medium">{selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedOrder.customerEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Телефон:</span>
                        <span className="font-medium">{selectedOrder.shippingAddress?.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Адреса и товары */}
                <div className="space-y-4">
                  {/* Адрес доставки */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Адрес доставки</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900">
                        {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}<br />
                        {selectedOrder.shippingAddress?.address}<br />
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}<br />
                        {selectedOrder.shippingAddress?.phone}
                      </p>
                    </div>
                  </div>

                  {/* Способ оплаты */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Способ оплаты</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900 capitalize">{selectedOrder.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Товары в заказе */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Товары в заказе</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={item.productImages && item.productImages[0] ? `http://localhost:5001${item.productImages[0]}` : '/placeholder.jpg'}
                              alt={item.productName}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => e.target.src = '/placeholder.jpg'}
                            />
                            <div>
                              <h5 className="font-medium text-gray-900">{item.productName}</h5>
                              <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.quantity} × {item.price?.toLocaleString('ru-RU')} ₽</p>
                            <p className="text-sm text-gray-600">Итого: {item.total?.toLocaleString('ru-RU')} ₽</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Информация о товарах недоступна
                    </div>
                  )}
                </div>
              </div>

              {/* Итого */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Итого к оплате:</span>
                  <span className="text-2xl font-bold text-gray-900">{selectedOrder.totalAmount?.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
