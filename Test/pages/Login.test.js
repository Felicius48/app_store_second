import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../frontend/src/pages/Login';
import { renderWithProviders } from '../utils/testUtils';
import * as api from '../../frontend/src/services/api';

jest.mock('../../frontend/src/services/api');

describe('Login Page', () => {
  beforeEach(() => {
    api.default.post = jest.fn();
  });

  it('отображает форму входа', () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('валидирует обязательные поля', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: /войти/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/обязательно/i)).toBeInTheDocument();
    });
  });

  it('отправляет данные при валидной форме', async () => {
    const user = userEvent.setup();
    api.default.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { id: 1, email: 'test@example.com' },
          token: 'test-token',
        },
      },
    });

    const { store } = renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(api.default.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('отображает ошибку при неверных данных', async () => {
    const user = userEvent.setup();
    api.default.post.mockRejectedValue({
      response: {
        data: {
          message: 'Неверный email или пароль',
        },
      },
    });

    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText(/неверный/i)).toBeInTheDocument();
    });
  });

  it('переходит на страницу регистрации', () => {
    renderWithProviders(<Login />);
    const registerLink = screen.getByText(/регистрация/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});
