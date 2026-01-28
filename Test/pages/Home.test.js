import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../../frontend/src/pages/Home';
import { renderWithProviders, mockProduct } from '../utils/testUtils';
import * as api from '../../frontend/src/services/api';
import * as settingsApi from '../../frontend/src/services/settings';

jest.mock('../../frontend/src/services/api');
jest.mock('../../frontend/src/services/settings');

describe('Home Page', () => {
  beforeEach(() => {
    api.default.get = jest.fn((url) => {
      if (url.includes('/products')) {
        return Promise.resolve({
          data: {
            data: {
              products: [mockProduct],
            },
          },
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({
          data: {
            data: {
              categories: [],
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    settingsApi.fetchBanners = jest.fn(() => Promise.resolve([]));
  });

  it('отображает заголовок "Предложение дня"', async () => {
    renderWithProviders(<Home />);
    await waitFor(() => {
      expect(screen.getByText('Предложение дня')).toBeInTheDocument();
    });
  });

  it('отображает баннеры', async () => {
    renderWithProviders(<Home />);
    await waitFor(() => {
      expect(screen.getByText('Смартфоны 2026')).toBeInTheDocument();
    });
  });

  it('отображает секцию "Наши преимущества"', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('Наши преимущества')).toBeInTheDocument();
    expect(screen.getByText('Широкий ассортимент')).toBeInTheDocument();
    expect(screen.getByText('Доставка по всей России')).toBeInTheDocument();
  });

  it('отображает карту и контакты', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('Контакты')).toBeInTheDocument();
    expect(screen.getByText('iTexnika')).toBeInTheDocument();
  });

  it('переключает баннеры при клике на стрелки', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Home />);

    await waitFor(() => {
      const nextButton = screen.getByLabelText('Следующий баннер');
      expect(nextButton).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText('Следующий баннер');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Ноутбуки для работы')).toBeInTheDocument();
    });
  });
});
