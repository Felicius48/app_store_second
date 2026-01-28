const Product = require('../../../backend/models/Product');
const { runQuery, getQuery, getAllQuery } = require('../../../backend/config/database');

jest.mock('../../../backend/config/database');

describe('Product Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен создать новый товар', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 1000,
        sku: 'TEST-001',
        stockQuantity: 10,
        categoryId: 1,
      };

      runQuery.mockResolvedValue({ id: 1 });

      const result = await Product.create(productData);

      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
    });

    it('должен генерировать slug из названия', async () => {
      const productData = {
        name: 'Test Product Name',
        price: 1000,
        sku: 'TEST-001',
        stockQuantity: 10,
      };

      runQuery.mockResolvedValue({ id: 1 });

      await Product.create(productData);

      const callArgs = runQuery.mock.calls[0];
      expect(callArgs[0]).toContain('INSERT INTO products');
      expect(callArgs[1]).toContainEqual(expect.stringMatching(/test-product-name/));
    });

    it('должен обработать categoryIds для связи многие-ко-многим', async () => {
      const productData = {
        name: 'Test Product',
        price: 1000,
        sku: 'TEST-001',
        stockQuantity: 10,
        categoryIds: [1, 2, 3],
      };

      runQuery
        .mockResolvedValueOnce({ id: 1 }) // INSERT products
        .mockResolvedValue({}); // INSERT product_categories

      await Product.create(productData);

      expect(runQuery).toHaveBeenCalledTimes(4); // 1 для product + 3 для categories
    });
  });

  describe('findById', () => {
    it('должен найти товар по ID', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        price: 1000,
        stock_quantity: 10,
        stock_status: 'in_stock',
        is_active: 1,
      };

      getQuery.mockResolvedValue(mockProduct);
      getAllQuery.mockResolvedValue([]); // categories

      const product = await Product.findById(1);

      expect(getQuery).toHaveBeenCalled();
      expect(product).toBeInstanceOf(Product);
      expect(product.id).toBe(1);
    });

    it('должен вернуть null если товар не найден', async () => {
      getQuery.mockResolvedValue(null);

      const product = await Product.findById(999);

      expect(product).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('должен найти товар по slug', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        price: 1000,
      };

      getQuery.mockResolvedValue(mockProduct);

      const product = await Product.findBySlug('test-product');

      expect(getQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.slug = ?'),
        ['test-product']
      );
      expect(product).toBeInstanceOf(Product);
    });
  });

  describe('findAll', () => {
    it('должен найти товары с фильтрами', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          price: 1000,
          stock_status: 'in_stock',
        },
        {
          id: 2,
          name: 'Product 2',
          price: 2000,
          stock_status: 'in_stock',
        },
      ];

      getAllQuery
        .mockResolvedValueOnce(mockProducts) // products
        .mockResolvedValue([]); // categories

      const products = await Product.findAll({
        categoryId: 1,
        minPrice: 500,
        maxPrice: 3000,
        search: 'Product',
      });

      expect(getAllQuery).toHaveBeenCalled();
      expect(products).toHaveLength(2);
      expect(products[0]).toBeInstanceOf(Product);
    });

    it('должен поддерживать фильтр по categoryIds', async () => {
      getAllQuery
        .mockResolvedValueOnce([]) // products
        .mockResolvedValue([]); // categories

      await Product.findAll({ categoryIds: [1, 2, 3] });

      const sql = getAllQuery.mock.calls[0][0];
      expect(sql).toContain('EXISTS');
      expect(sql).toContain('product_categories');
    });
  });

  describe('update', () => {
    it('должен обновить товар', async () => {
      runQuery
        .mockResolvedValueOnce({ changes: 1 }) // UPDATE products
        .mockResolvedValue({}); // setCategories

      const updateData = {
        name: 'Updated Product',
        price: 1500,
      };

      const result = await Product.update(1, updateData);

      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  describe('delete', () => {
    it('должен выполнить мягкое удаление товара', async () => {
      runQuery.mockResolvedValue({ changes: 1 });

      const result = await Product.delete(1);

      expect(runQuery).toHaveBeenCalledWith(
        'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [1]
      );
      expect(result).toHaveProperty('message');
    });
  });

  describe('getCurrentPrice', () => {
    it('должен вернуть salePrice если он меньше price', () => {
      const product = new Product({
        id: 1,
        price: 1000,
        sale_price: 800,
      });

      expect(product.getCurrentPrice()).toBe(800);
    });

    it('должен вернуть price если salePrice больше или отсутствует', () => {
      const product = new Product({
        id: 1,
        price: 1000,
        sale_price: 1200,
      });

      expect(product.getCurrentPrice()).toBe(1000);
    });
  });

  describe('isAvailable', () => {
    it('должен вернуть true для доступного товара', () => {
      const product = new Product({
        id: 1,
        is_active: 1,
        stock_status: 'in_stock',
        stock_quantity: 10,
      });

      expect(product.isAvailable()).toBe(true);
    });

    it('должен вернуть false для недоступного товара', () => {
      const product = new Product({
        id: 1,
        is_active: 0,
        stock_status: 'out_of_stock',
        stock_quantity: 0,
      });

      expect(product.isAvailable()).toBe(false);
    });
  });

  describe('generateSlug', () => {
    it('должен генерировать slug из названия', () => {
      const slug = Product.generateSlug('Test Product Name');
      expect(slug).toBe('test-product-name');
    });

    it('должен обрабатывать специальные символы', () => {
      const slug = Product.generateSlug('Test & Product!');
      expect(slug).toBe('test-product');
    });
  });
});
