import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Favorites from '../../frontend/src/pages/Favorites';
import { renderWithProviders, mockUser, mockProduct } from '../utils/testUtils';
import * as favoritesApi from '../../frontend/src/services/favorites';

jest.mock('../../frontend/src/services/favorites');

describe('Favorites Page', () => {
  beforeEach(() => {
    favoritesApi.fetchFavorites = jest.fn(() => Promise.resolve([mockProduct]));
  });

  it('показывает сообщение для неавторизованных пользователей', () => {
    renderWithProviders(<Favorites />, {
      preloadedState: {
        auth: { user: null, token: null },
        favorites: { items: [] },
      },
    });

    expect(screen.getByText('Избранное')).toBeInTheDocument();
    expect(screen.getByText(/войдите в аккаунт/i)).toBeInTheDocument();
  });

  it('показывает сообщение при пустом избранном', () => {
    renderWithProviders(<Favorites />, {
      preloadedState: {
        auth: { user: mockUser, token: 'test-token' },
        favorites: { items: [] },
      },
    });

    expect(screen.getByText('Избранное пусто')).toBeInTheDocument();
  });

  it('отображает список избранных товаров', () => {
    renderWithProviders(<Favorites />, {
      preloadedState: {
        auth: { user: mockUser, token: 'test-token' },
        favorites: {
          items: [mockProduct],
        },
      },
    });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('удаляет товар из избранного', async () => {
    const user = userEvent.setup();
    favoritesApi.removeFavorite = jest.fn(() => Promise.resolve());

    const { store } = renderWithProviders(<Favorites />, {
      preloadedState: {
        auth: { user: mockUser, token: 'test-token' },
        favorites: {
          items: [mockProduct],
        },
      },
    });

    const removeButtons = screen.getAllByRole('button', { name: /×/i });
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(favoritesApi.removeFavorite).toHaveBeenCalled();
      });
    }
  });

  it('очищает весь список избранного', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Favorites />, {
      preloadedState: {
        auth: { user: mockUser, token: 'test-token' },
        favorites: {
          items: [mockProduct],
        },
      },
    });

    const clearButton = screen.getByText('Очистить список');
    await user.click(clearButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.favorites.items).toHaveLength(0);
    });
  });
});
