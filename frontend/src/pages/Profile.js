import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getProfile, clearError } from '../features/auth/authSlice';
import { fetchUserOrders } from '../features/orders/ordersSlice';
import { CameraIcon, UserIcon, ShoppingBagIcon, MapPinIcon, CreditCardIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import api from '../services/api';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);
  const { orders, loading: ordersLoading, error: ordersError } = useSelector((state) => state.orders);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [profileForm, setProfileForm] = useState({
    address: '',
    city: '',
    postalCode: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');

  useEffect(() => {
    if (!user) {
      dispatch(getProfile());
    }
    // Загружаем заказы пользователя
    dispatch(fetchUserOrders());
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || ''
      });
    }
  }, [user]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Пожалуйста, выберите изображение (JPEG, PNG или GIF)');
      return;
    }

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('http://localhost:5001/api/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем профиль
        dispatch(getProfile());
        alert('Аватар успешно загружен!');
      } else {
        alert(result.message || 'Ошибка загрузки аватара');
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      alert('Произошла ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить аватар?')) return;

    try {
      const response = await fetch('http://localhost:5001/api/auth/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        dispatch(getProfile());
        alert('Аватар удален!');
      } else {
        alert(result.message || 'Ошибка удаления аватара');
      }
    } catch (error) {
      console.error('Ошибка удаления аватара:', error);
      alert('Произошла ошибка при удалении аватара');
    }
  };


  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает подтверждения',
      'processing': 'Подтвержден',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'processing': 'text-blue-600 bg-blue-100',
      'shipped': 'text-purple-600 bg-purple-100',
      'delivered': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  const getPaymentStatusColor = (status) => {
    const colorMap = {
      'paid': 'text-green-600 bg-green-100',
      'pending': 'text-yellow-600 bg-yellow-100',
      'failed': 'text-red-600 bg-red-100',
      'refunded': 'text-gray-600 bg-gray-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  const handleViewOrderDetails = async (orderId) => {
    setSelectedOrder(orderId);
    setLoadingDetails(true);
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrderDetails(response.data.data.order);
    } catch (error) {
      console.error('Ошибка загрузки деталей заказа:', error);
      alert('Не удалось загрузить детали заказа');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDeliveryAddress = async () => {
    setIsSavingProfile(true);
    setProfileSaveMessage('');
    try {
      const payload = {
        address: profileForm.address.trim(),
        city: profileForm.city.trim(),
        postalCode: profileForm.postalCode.trim()
      };
      const response = await api.put('/auth/profile', payload);
      if (response.data?.success) {
        dispatch(getProfile());
        setProfileSaveMessage('Адрес доставки обновлен');
      } else {
        setProfileSaveMessage(response.data?.message || 'Не удалось обновить адрес');
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Не удалось обновить адрес';
      setProfileSaveMessage(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки профиля</h1>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button
            onClick={() => dispatch(getProfile())}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Пользователь не найден</h1>
          <Link
            to="/login"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 inline-block"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Боковая панель */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            {/* Аватар */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden mx-auto mb-4">
                  {user.avatarUrl ? (
                    <img
                      src={`http://localhost:5001${user.avatarUrl}`}
                      alt="Аватар"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '';
                        if (e.target.parentElement) {
                          e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-2xl"><div>👤</div></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      👤
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 disabled:opacity-50"
                    title="Загрузить аватар"
                  >
                    <CameraIcon className="h-4 w-4" />
                  </button>

                  {user.avatarUrl && (
                    <button
                      onClick={handleAvatarDelete}
                      className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      title="Удалить аватар"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                {isUploading && (
                  <p className="text-sm text-gray-600 mt-2">Загрузка...</p>
                )}
              </div>
            </div>

            {/* Меню */}
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <UserIcon className="h-5 w-5 inline mr-2" />
                Профиль
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ShoppingBagIcon className="h-5 w-5 inline mr-2" />
                Заказы
              </button>
            </nav>
          </div>
        </div>

        {/* Основной контент */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Информация о профиле</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {user.firstName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фамилия
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {user.lastName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {user.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {user.phone || 'Не указан'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Роль
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md capitalize">
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата регистрации
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Адрес доставки</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Адрес
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={profileForm.address}
                      onChange={handleProfileChange}
                      placeholder="ул. Ленина, д. 1, кв. 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Город
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={profileForm.city}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Индекс
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={profileForm.postalCode}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSaveDeliveryAddress}
                    disabled={isSavingProfile}
                    className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Сохранение...' : 'Сохранить адрес'}
                  </button>
                  {profileSaveMessage && (
                    <span className="text-sm text-gray-600">{profileSaveMessage}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">История заказов</h2>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">У вас пока нет заказов</h3>
                    <p className="text-gray-600 mb-6">Сделайте свой первый заказ в нашем магазине</p>
                    <Link
                      to="/products"
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-block"
                    >
                      Перейти к товарам
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Заказ #{order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </div>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                              {order.totalAmount.toLocaleString('ru-RU')} ₽
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{item.productName}</span>
                                <span className="text-gray-600">
                                  {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              Детали заказа недоступны
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className={`flex items-center px-2 py-1 rounded ${getPaymentStatusColor(order.paymentStatus)}`}>
                              <CreditCardIcon className="h-4 w-4 mr-1" />
                              <span className="text-xs font-medium">
                                {order.paymentStatus === 'paid' ? 'Оплачено' : order.paymentStatus === 'pending' ? 'Ожидает оплаты' : 'Ошибка оплаты'}
                              </span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleViewOrderDetails(order.id)}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Подробнее
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно с деталями заказа */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeOrderModal}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Детали заказа</h3>
              <button
                onClick={closeOrderModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingDetails ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : orderDetails ? (
                <div className="space-y-6">
                  {/* Информация о заказе */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Номер заказа</div>
                      <div className="font-semibold text-gray-900">{orderDetails.orderNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Дата заказа</div>
                      <div className="font-semibold text-gray-900">
                        {new Date(orderDetails.createdAt).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Статус заказа</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderDetails.status)}`}>
                        {orderDetails.statusText}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Статус оплаты</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(orderDetails.paymentStatus)}`}>
                        {orderDetails.paymentStatusText}
                      </div>
                    </div>
                  </div>

                  {/* Товары в заказе */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Товары в заказе</h4>
                    <div className="space-y-3">
                      {orderDetails.items && orderDetails.items.length > 0 ? (
                        orderDetails.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            {item.productImages && item.productImages[0] && (
                              <img
                                src={`http://localhost:5001${item.productImages[0]}`}
                                alt={item.productName}
                                className="w-16 h-16 object-cover rounded"
                                onError={(e) => e.target.src = '/placeholder.jpg'}
                              />
                            )}
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.productName}</h5>
                              {item.productSku && (
                                <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽
                              </p>
                              <p className="text-sm text-gray-600">
                                Итого: {item.total.toLocaleString('ru-RU')} ₽
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Информация о товарах недоступна
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Адрес доставки */}
                  {orderDetails.shippingAddress && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Адрес доставки</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="text-sm text-gray-700">
                            {orderDetails.shippingAddress.street && (
                              <div>{orderDetails.shippingAddress.street}</div>
                            )}
                            {orderDetails.shippingAddress.city && (
                              <div>{orderDetails.shippingAddress.city}</div>
                            )}
                            {orderDetails.shippingAddress.postalCode && (
                              <div>Индекс: {orderDetails.shippingAddress.postalCode}</div>
                            )}
                            {orderDetails.shippingAddress.country && (
                              <div>{orderDetails.shippingAddress.country}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Итоговая сумма */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-2">
                      {orderDetails.shippingAmount > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Доставка</span>
                          <span>{orderDetails.shippingAmount.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      )}
                      {orderDetails.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Скидка</span>
                          <span>-{orderDetails.discountAmount.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Итого</span>
                        <span>{orderDetails.totalAmount.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Не удалось загрузить детали заказа
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
