import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '../../frontend/src/components/Header';
import { renderWithProviders, mockUser, mockAdmin } from '../utils/testUtils';
import * as categoriesSlice from '../../frontend/src/features/categories/categoriesSlice';

jest.mock('../../frontend/src/features/categories/categoriesSlice');

describe('Header Component', () => {
  beforeEach(() => {
    categoriesSlice.fetchCategoryTree = jest.fn(() => ({
      type: 'categories/fetchCategoryTree',
      payload: [],
    }));
  });

  it('отображает логотип и кнопку каталога', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('TechStore')).toBeInTheDocument();
    expect(screen.getByText('Каталог')).toBeInTheDocument();
  });

  it('отображает кнопки входа и регистрации для неавторизованных пользователей', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('Войти')).toBeInTheDocument();
    expect(screen.getByText('Регистрация')).toBeInTheDocument();
  });

  it('отображает имя пользователя и меню для авторизованных пользователей', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />, {
      preloadedState: {
        auth: { user: mockUser, token: 'test-token' },
        favorites: { items: [] },
        categories: { categoryTree: [] },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  it('отображает кнопку админ-панели для администратора', async () => {
    renderWithProviders(<Header />, {
      preloadedState: {
        auth: { user: mockAdmin, token: 'test-token' },
        favorites: { items: [] },
        categories: { categoryTree: [] },
      },
    });

    await waitFor(() => {
      const userButton = screen.getByText('Admin');
      userEvent.hover(userButton);
      expect(screen.getByText('Админ-панель')).toBeInTheDocument();
    });
  });

  it('открывает модальное окно каталога при клике на кнопку', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />, {
      preloadedState: {
        categories: {
          categoryTree: [
            { id: 1, name: 'Category 1', children: [] },
          ],
        },
      },
    });

    const catalogButton = screen.getByText('Каталог');
    await user.click(catalogButton);

    await waitFor(() => {
      expect(screen.getByText('Категории товаров')).toBeInTheDocument();
    });
  });

  it('отображает количество товаров в корзине', () => {
    renderWithProviders(<Header />, {
      preloadedState: {
        cart: {
          items: [
            { id: 1, name: 'Product 1', price: 100, quantity: 2 },
            { id: 2, name: 'Product 2', price: 200, quantity: 1 },
          ],
          total: 400,
        },
        favorites: { items: [] },
        categories: { categoryTree: [] },
      },
    });

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('отображает количество избранных товаров', () => {
    renderWithProviders(<Header />, {
      preloadedState: {
        auth: { user: mockUser, token: 'test-token' },
        favorites: {
          items: [
            { id: 1, name: 'Favorite 1' },
            { id: 2, name: 'Favorite 2' },
          ],
        },
        categories: { categoryTree: [] },
      },
    });

    const favoriteLink = screen.getByRole('link', { name: /favorites/i });
    expect(favoriteLink).toBeInTheDocument();
  });
});
