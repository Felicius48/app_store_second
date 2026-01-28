import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Cart from '../../frontend/src/pages/Cart';
import { renderWithProviders, mockProduct } from '../utils/testUtils';

describe('Cart Page', () => {
  const mockCartItems = [
    {
      id: 1,
      name: 'Product 1',
      price: 1000,
      quantity: 2,
      image: '/uploads/test1.jpg',
    },
    {
      id: 2,
      name: 'Product 2',
      price: 2000,
      quantity: 1,
      image: '/uploads/test2.jpg',
    },
  ];

  it('отображает сообщение при пустой корзине', () => {
    renderWithProviders(<Cart />, {
      preloadedState: {
        cart: { items: [], total: 0 },
      },
    });

    expect(screen.getByText('Корзина пуста')).toBeInTheDocument();
    expect(screen.getByText('Перейти к товарам')).toBeInTheDocument();
  });

  it('отображает список товаров в корзине', () => {
    renderWithProviders(<Cart />, {
      preloadedState: {
        cart: {
          items: mockCartItems,
          total: 4000,
        },
      },
    });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('отображает итоговую сумму', () => {
    renderWithProviders(<Cart />, {
      preloadedState: {
        cart: {
          items: mockCartItems,
          total: 4000,
        },
      },
    });

    expect(screen.getByText(/4 000 ₽/)).toBeInTheDocument();
  });

  it('увеличивает количество товара', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Cart />, {
      preloadedState: {
        cart: {
          items: [{ ...mockCartItems[0], quantity: 1 }],
          total: 1000,
        },
      },
    });

    const plusButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('svg') && btn.querySelector('svg').classList.contains('h-4')
    );

    if (plusButton) {
      await user.click(plusButton);
      await waitFor(() => {
        const state = store.getState();
        expect(state.cart.items[0].quantity).toBe(2);
      });
    }
  });

  it('удаляет товар из корзины', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Cart />, {
      preloadedState: {
        cart: {
          items: mockCartItems,
          total: 4000,
        },
      },
    });

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i });
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        const state = store.getState();
        expect(state.cart.items.length).toBe(1);
      });
    }
  });

  it('очищает корзину', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);

    const { store } = renderWithProviders(<Cart />, {
      preloadedState: {
        cart: {
          items: mockCartItems,
          total: 4000,
        },
      },
    });

    const clearButton = screen.getByText('Очистить корзину');
    await user.click(clearButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.cart.items).toHaveLength(0);
    });
  });

  it('отображает кнопку оформления заказа', () => {
    renderWithProviders(<Cart />, {
      preloadedState: {
        cart: {
          items: mockCartItems,
          total: 4000,
        },
      },
    });

    expect(screen.getByText('Оформить заказ')).toBeInTheDocument();
  });
});
