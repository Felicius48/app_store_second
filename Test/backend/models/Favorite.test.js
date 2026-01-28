const Favorite = require('../../../backend/models/Favorite');
const { runQuery, getAllQuery } = require('../../../backend/config/database');
const Product = require('../../../backend/models/Product');

jest.mock('../../../backend/config/database');
jest.mock('../../../backend/models/Product');

describe('Favorite Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listProductsByUser', () => {
    it('должен вернуть список избранных товаров пользователя', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          price: 1000,
          is_active: 1,
        },
        {
          id: 2,
          name: 'Product 2',
          price: 2000,
          is_active: 1,
        },
      ];

      getAllQuery.mockResolvedValue(mockProducts);

      const products = await Favorite.listProductsByUser(1);

      expect(getAllQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM favorites f'),
        [1]
      );
      expect(products).toHaveLength(2);
      expect(products[0]).toBeInstanceOf(Product);
    });
  });

  describe('add', () => {
    it('должен добавить товар в избранное', async () => {
      runQuery.mockResolvedValue({});

      await Favorite.add(1, 1);

      expect(runQuery).toHaveBeenCalledWith(
        'INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)',
        [1, 1]
      );
    });

    it('не должен выбросить ошибку при дублировании', async () => {
      runQuery.mockResolvedValue({});

      await expect(Favorite.add(1, 1)).resolves.not.toThrow();
    });
  });

  describe('remove', () => {
    it('должен удалить товар из избранного', async () => {
      runQuery.mockResolvedValue({ changes: 1 });

      await Favorite.remove(1, 1);

      expect(runQuery).toHaveBeenCalledWith(
        'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
        [1, 1]
      );
    });
  });
});
