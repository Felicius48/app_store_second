import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from '../../frontend/src/components/ProductCard';
import { renderWithProviders, mockProduct, mockUser } from '../utils/testUtils';

// Мокаем навигацию
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ProductCard Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('отображает название и цену товара', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/1 000 ₽/)).toBeInTheDocument();
  });

  it('отображает изображение товара', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('test.jpg'));
  });

  it('переходит на страницу товара при клике', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />);

    const card = screen.getByText('Test Product').closest('a');
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalled();
  });

  it('добавляет товар в корзину при клике на кнопку', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ProductCard product={mockProduct} />);

    const addToCartButton = screen.getByText('В корзину');
    await user.click(addToCartButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0].id).toBe(1);
    });
  });

  it('показывает модальное окно при попытке добавить в избранное без авторизации', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={mockProduct} />, {
      preloadedState: {
        auth: { user: null, token: null },
        favorites: { items: [] },
      },
    });

    const favoriteButton = screen.getByTitle('В избранное');
    await user.click(favoriteButton);

    await waitFor(() => {
      expect(screen.getByText('Похоже Вы не авторизованы(')).toBeInTheDocument();
    });
  });

  it('добавляет товар в избранное для авторизованного пользователя', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ProductCard product={mockProduct} />, {
      preloadedState: {
        auth: { user: mockUser, token: 'test-token' },
        favorites: { items: [] },
      },
    });

    const favoriteButton = screen.getByTitle('В избранное');
    await user.click(favoriteButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.favorites.items.length).toBeGreaterThan(0);
    });
  });

  it('отображает статус наличия товара', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/В наличии/)).toBeInTheDocument();
  });

  it('отображает статус отсутствия товара', () => {
    const outOfStockProduct = { ...mockProduct, stockStatus: 'out_of_stock' };
    renderWithProviders(<ProductCard product={outOfStockProduct} />);
    expect(screen.getByText(/Нет в наличии/)).toBeInTheDocument();
  });
});
