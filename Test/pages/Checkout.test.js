import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkout from '../../frontend/src/pages/Checkout';
import { renderWithProviders, mockUser, mockProduct } from '../utils/testUtils';
import * as ordersSlice from '../../frontend/src/features/orders/ordersSlice';
import * as api from '../../frontend/src/services/api';

jest.mock('../../frontend/src/features/orders/ordersSlice');
jest.mock('../../frontend/src/services/api');

describe('Checkout Page', () => {
  const mockCartItems = [
    {
      id: 1,
      name: 'Product 1',
      price: 1000,
      quantity: 2,
      image: '/uploads/test.jpg',
    },
  ];

  beforeEach(() => {
    ordersSlice.createOrder = jest.fn(() => ({
      type: 'orders/createOrder',
      payload: { orderId: 1 },
    }));

    api.default.post = jest.fn(() =>
      Promise.resolve({
        data: {
          data: {
            confirmationUrl: 'https://yookassa.ru/pay',
          },
        },
      })
    );
  });

  it('показывает сообщение при пустой корзине', () => {
    renderWithProviders(<Checkout />, {
      preloadedState: {
        cart: { items: [], total: 0 },
        auth: { user: mockUser, token: 'test-token' },
      },
    });

    expect(screen.getByText(/корзина пуста/i)).toBeInTheDocument();
  });

  it('предзаполняет данные из профиля пользователя', () => {
    const userWithAddress = {
      ...mockUser,
      address: 'Test Street 1',
      city: 'Test City',
      postalCode: '12345',
    };

    renderWithProviders(<Checkout />, {
      preloadedState: {
        cart: { items: mockCartItems, total: 2000 },
        auth: { user: userWithAddress, token: 'test-token' },
      },
    });

    expect(screen.getByDisplayValue('Test Street 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test City')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
  });

  it('валидирует обязательные поля формы', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Checkout />, {
      preloadedState: {
        cart: { items: mockCartItems, total: 2000 },
        auth: { user: mockUser, token: 'test-token' },
      },
    });

    const submitButton = screen.getByRole('button', { name: /оформить заказ/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/обязательно/i)).toBeInTheDocument();
    });
  });

  it('создает заказ при валидной форме', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Checkout />, {
      preloadedState: {
        cart: { items: mockCartItems, total: 2000 },
        auth: {
          user: {
            ...mockUser,
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '+79991234567',
            address: 'Test Street',
            city: 'Test City',
            postalCode: '12345',
          },
          token: 'test-token',
        },
      },
    });

    await user.click(screen.getByRole('button', { name: /оформить заказ/i }));

    await waitFor(() => {
      expect(ordersSlice.createOrder).toHaveBeenCalled();
    });
  });

  it('отображает список товаров в заказе', () => {
    renderWithProviders(<Checkout />, {
      preloadedState: {
        cart: { items: mockCartItems, total: 2000 },
        auth: { user: mockUser, token: 'test-token' },
      },
    });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText(/2 000 ₽/)).toBeInTheDocument();
  });

  it('показывает способы доставки', () => {
    renderWithProviders(<Checkout />, {
      preloadedState: {
        cart: { items: mockCartItems, total: 2000 },
        auth: { user: mockUser, token: 'test-token' },
      },
    });

    expect(screen.getByText('Стандартная доставка')).toBeInTheDocument();
    expect(screen.getByText('Экспресс доставка')).toBeInTheDocument();
    expect(screen.getByText('Самовывоз')).toBeInTheDocument();
  });

  it('показывает способы оплаты', () => {
    renderWithProviders(<Checkout />, {
      preloadedState: {
        cart: { items: mockCartItems, total: 2000 },
        auth: { user: mockUser, token: 'test-token' },
      },
    });

    expect(screen.getByText('Банковская карта')).toBeInTheDocument();
    expect(screen.getByText('Наличными при получении')).toBeInTheDocument();
  });
});
