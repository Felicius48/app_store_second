import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../../frontend/src/features/cart/cartSlice';

describe('Cart Slice', () => {
  const initialState = {
    items: [],
    total: 0,
  };

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 1000,
    image: '/test.jpg',
    quantity: 1,
  };

  it('должен вернуть начальное состояние', () => {
    expect(cartReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('добавляет товар в корзину', () => {
    const action = addToCart(mockProduct);
    const state = cartReducer(initialState, action);

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(mockProduct);
    expect(state.total).toBe(1000);
  });

  it('увеличивает количество при добавлении существующего товара', () => {
    const stateWithItem = {
      items: [mockProduct],
      total: 1000,
    };

    const action = addToCart(mockProduct);
    const state = cartReducer(stateWithItem, action);

    expect(state.items[0].quantity).toBe(2);
    expect(state.total).toBe(2000);
  });

  it('удаляет товар из корзины', () => {
    const stateWithItems = {
      items: [mockProduct, { ...mockProduct, id: 2 }],
      total: 2000,
    };

    const action = removeFromCart(1);
    const state = cartReducer(stateWithItems, action);

    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe(2);
    expect(state.total).toBe(1000);
  });

  it('обновляет количество товара', () => {
    const stateWithItem = {
      items: [mockProduct],
      total: 1000,
    };

    const action = updateQuantity({ id: 1, quantity: 3 });
    const state = cartReducer(stateWithItem, action);

    expect(state.items[0].quantity).toBe(3);
    expect(state.total).toBe(3000);
  });

  it('не позволяет установить количество меньше 1', () => {
    const stateWithItem = {
      items: [mockProduct],
      total: 1000,
    };

    const action = updateQuantity({ id: 1, quantity: 0 });
    const state = cartReducer(stateWithItem, action);

    expect(state.items[0].quantity).toBe(1);
  });

  it('очищает корзину', () => {
    const stateWithItems = {
      items: [mockProduct, { ...mockProduct, id: 2 }],
      total: 2000,
    };

    const action = clearCart();
    const state = cartReducer(stateWithItems, action);

    expect(state.items).toHaveLength(0);
    expect(state.total).toBe(0);
  });

  it('правильно вычисляет итоговую сумму', () => {
    const stateWithMultipleItems = {
      items: [
        { ...mockProduct, id: 1, quantity: 2 },
        { ...mockProduct, id: 2, price: 2000, quantity: 1 },
      ],
      total: 0,
    };

    const action = addToCart({ id: 3, price: 500, quantity: 1 });
    const state = cartReducer(stateWithMultipleItems, action);

    expect(state.total).toBe(4500);
  });
});
