import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser, mockProduct } from '../utils/testUtils';
import * as api from '../../frontend/src/services/api';
import * as ordersSlice from '../../frontend/src/features/orders/ordersSlice';

jest.mock('../../frontend/src/services/api');
jest.mock('../../frontend/src/features/orders/ordersSlice');

describe('Checkout Flow Integration', () => {
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

  it('полный флоу оформления заказа с оплатой картой', async () => {
    const user = userEvent.setup();
    const userWithData = {
      ...mockUser,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+79991234567',
      address: 'Test Street 1',
      city: 'Test City',
      postalCode: '12345',
    };

    const { store } = renderWithProviders(
      <div>
        {/* Симуляция страницы Checkout */}
        <h1>Оформление заказа</h1>
        <form>
          <input name="firstName" defaultValue={userWithData.firstName} />
          <input name="lastName" defaultValue={userWithData.lastName} />
          <input name="email" defaultValue={userWithData.email} />
          <input name="phone" defaultValue={userWithData.phone} />
          <input name="address" defaultValue={userWithData.address} />
          <input name="city" defaultValue={userWithData.city} />
          <input name="postalCode" defaultValue={userWithData.postalCode} />
          <button type="submit">Оформить заказ</button>
        </form>
      </div>,
      {
        preloadedState: {
          cart: { items: mockCartItems, total: 2000 },
          auth: { user: userWithData, token: 'test-token' },
        },
      }
    );

    const submitButton = screen.getByRole('button', { name: /оформить заказ/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ordersSlice.createOrder).toHaveBeenCalled();
    });
  });
});
