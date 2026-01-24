import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CheckCircleIcon, HomeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { clearCart } from '../features/cart/cartSlice';
import api from '../services/api';

const OrderSuccess = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [cartCleared, setCartCleared] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await api.get(`/payments/status/${orderId}`);
        setOrder(res?.data?.data?.order || null);
      } catch (e) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  useEffect(() => {
    if (!cartCleared && order?.paymentStatus === 'paid') {
      dispatch(clearCart());
      setCartCleared(true);
    }
  }, [cartCleared, dispatch, order?.paymentStatus]);

  const paymentStatusText =
    order?.paymentStatus === 'paid'
      ? 'Оплата прошла успешно'
      : order?.paymentStatus === 'pending'
        ? 'Ожидаем подтверждение оплаты'
        : order?.paymentStatus === 'failed'
          ? 'Оплата не прошла'
          : null;

  const orderStatusText = order?.statusText || 'Ожидает подтверждения';

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center">
        <div className={`w-20 h-20 ${order?.paymentStatus === 'paid' ? 'bg-green-100' : order?.paymentStatus === 'failed' ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <CheckCircleIcon className={`h-12 w-12 ${order?.paymentStatus === 'paid' ? 'text-green-600' : order?.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'}`} />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {order?.paymentStatus === 'paid' ? 'Заказ принят и оплачен!' : order?.paymentStatus === 'failed' ? 'Ошибка оплаты' : 'Заказ принят!'}
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          {order?.paymentStatus === 'paid' 
            ? 'Спасибо за покупку! Ваш заказ успешно оплачен и принят в обработку.'
            : order?.paymentStatus === 'failed'
              ? 'К сожалению, оплата не прошла. Пожалуйста, попробуйте снова или свяжитесь с поддержкой.'
              : 'Спасибо за покупку! Мы получили ваш заказ. Ожидаем подтверждения оплаты.'}
        </p>

        {orderId && (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6 text-left">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Номер заказа</div>
                <div className="font-semibold text-lg text-gray-900">{order?.orderNumber || `#${orderId}`}</div>
              </div>

              {loading ? (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>Проверяем статус оплаты…</span>
                </div>
              ) : (
                <>
                  {order?.paymentStatus && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Статус оплаты</div>
                      <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus === 'paid' && '✓ '}
                        {paymentStatusText}
                      </div>
                      {order.paymentStatus === 'paid' && order.paymentPaidAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Оплачено: {new Date(order.paymentPaidAt).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  )}

                  {order?.status && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Статус заказа</div>
                      <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-medium ${getOrderStatusColor(order.status)}`}>
                        {orderStatusText}
                      </div>
                    </div>
                  )}

                  {order?.totalAmount && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Сумма заказа</div>
                      <div className="font-bold text-xl text-gray-900">
                        {order.totalAmount.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Что происходит дальше?
          </h2>

          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Подтверждение заказа</p>
                <p className="text-sm text-gray-600">Мы отправим подтверждение на ваш email</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Обработка заказа</p>
                <p className="text-sm text-gray-600">Подготовка товаров к отправке (1-2 дня)</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Отправка</p>
                <p className="text-sm text-gray-600">Отправка заказа транспортной компанией</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Получение</p>
                <p className="text-sm text-gray-600">Доставка и получение заказа</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ShoppingBagIcon className="h-5 w-5 mr-2" />
            Продолжить покупки
          </Link>

          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            На главную
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Номер заказа и детали отправлены на ваш email.
            <br />
            При возникновении вопросов звоните: <span className="font-medium">+7 (999) 123-45-67</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
