import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Products from '../../frontend/src/pages/Products';
import { renderWithProviders, mockProduct, mockCategory } from '../utils/testUtils';
import * as productsSlice from '../../frontend/src/features/products/productsSlice';
import * as categoriesSlice from '../../frontend/src/features/categories/categoriesSlice';

jest.mock('../../frontend/src/features/products/productsSlice');
jest.mock('../../frontend/src/features/categories/categoriesSlice');

describe('Products Page', () => {
  beforeEach(() => {
    productsSlice.fetchProducts = jest.fn(() => ({
      type: 'products/fetchProducts',
      payload: [mockProduct],
    }));

    categoriesSlice.fetchCategoryTree = jest.fn(() => ({
      type: 'categories/fetchCategoryTree',
      payload: [mockCategory],
    }));
  });

  it('отображает заголовок "Каталог товаров"', () => {
    renderWithProviders(<Products />, {
      preloadedState: {
        products: {
          products: [mockProduct],
          loading: false,
          error: null,
        },
        categories: {
          categoryTree: [mockCategory],
        },
      },
    });

    expect(screen.getByText('Каталог товаров')).toBeInTheDocument();
  });

  it('отображает список товаров', () => {
    renderWithProviders(<Products />, {
      preloadedState: {
        products: {
          products: [mockProduct],
          loading: false,
          error: null,
        },
        categories: {
          categoryTree: [],
        },
      },
    });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('отображает фильтры', () => {
    renderWithProviders(<Products />, {
      preloadedState: {
        products: {
          products: [],
          loading: false,
          error: null,
        },
        categories: {
          categoryTree: [],
        },
      },
    });

    expect(screen.getByPlaceholderText('Поиск товаров...')).toBeInTheDocument();
  });

  it('показывает сообщение при отсутствии товаров', () => {
    renderWithProviders(<Products />, {
      preloadedState: {
        products: {
          products: [],
          loading: false,
          error: null,
        },
        categories: {
          categoryTree: [],
        },
      },
    });

    expect(screen.getByText('Товары не найдены')).toBeInTheDocument();
  });

  it('показывает индикатор загрузки', () => {
    renderWithProviders(<Products />, {
      preloadedState: {
        products: {
          products: [],
          loading: true,
          error: null,
        },
        categories: {
          categoryTree: [],
        },
      },
    });

    // Проверяем наличие спиннера загрузки
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
