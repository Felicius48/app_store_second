import authReducer, {
  login,
  register,
  logout,
  getProfile,
  clearError,
} from '../../frontend/src/features/auth/authSlice';

describe('Auth Slice', () => {
  const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  };

  const mockToken = 'test-token';

  it('должен вернуть начальное состояние', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('обрабатывает login.pending', () => {
    const action = { type: login.pending.type };
    const state = authReducer(initialState, action);

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('обрабатывает login.fulfilled', () => {
    const action = {
      type: login.fulfilled.type,
      payload: { user: mockUser, token: mockToken },
    };
    const state = authReducer(initialState, action);

    expect(state.loading).toBe(false);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
  });

  it('обрабатывает login.rejected', () => {
    const errorMessage = 'Неверный email или пароль';
    const action = {
      type: login.rejected.type,
      payload: errorMessage,
    };
    const state = authReducer(initialState, action);

    expect(state.loading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  it('обрабатывает register.fulfilled', () => {
    const action = {
      type: register.fulfilled.type,
      payload: { user: mockUser, token: mockToken },
    };
    const state = authReducer(initialState, action);

    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
  });

  it('обрабатывает logout', () => {
    const stateWithUser = {
      user: mockUser,
      token: mockToken,
      loading: false,
      error: null,
    };

    const action = logout();
    const state = authReducer(stateWithUser, action);

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('обрабатывает getProfile.fulfilled', () => {
    const action = {
      type: getProfile.fulfilled.type,
      payload: mockUser,
    };
    const state = authReducer(initialState, action);

    expect(state.user).toEqual(mockUser);
    expect(state.loading).toBe(false);
  });

  it('очищает ошибку', () => {
    const stateWithError = {
      ...initialState,
      error: 'Some error',
    };

    const action = clearError();
    const state = authReducer(stateWithError, action);

    expect(state.error).toBeNull();
  });
});
