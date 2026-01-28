const Category = require('../../../backend/models/Category');
const { runQuery, getQuery, getAllQuery } = require('../../../backend/config/database');

jest.mock('../../../backend/config/database');

describe('Category Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен создать новую категорию', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test description',
      };

      runQuery.mockResolvedValue({ id: 1 });

      const result = await Category.create(categoryData);

      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
    });

    it('должен генерировать slug с транслитерацией кириллицы', async () => {
      const categoryData = {
        name: 'Смартфоны',
      };

      runQuery.mockResolvedValue({ id: 1 });

      await Category.create(categoryData);

      const callArgs = runQuery.mock.calls[0];
      const slug = callArgs[1][1]; // второй параметр - slug
      expect(slug).toMatch(/smartfony/);
    });

    it('должен обработать дублирование slug', async () => {
      const categoryData = {
        name: 'Test Category',
      };

      runQuery
        .mockRejectedValueOnce(new Error('UNIQUE constraint failed'))
        .mockResolvedValue({ id: 1 });

      const result = await Category.create(categoryData);

      expect(runQuery).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('id');
    });
  });

  describe('findById', () => {
    it('должен найти категорию по ID', async () => {
      const mockCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test-category',
        is_active: 1,
      };

      getQuery.mockResolvedValue(mockCategory);

      const category = await Category.findById(1);

      expect(getQuery).toHaveBeenCalledWith(
        'SELECT * FROM categories WHERE id = ? AND is_active = 1',
        [1]
      );
      expect(category).toBeInstanceOf(Category);
      expect(category.id).toBe(1);
    });
  });

  describe('findBySlug', () => {
    it('должен найти категорию по slug', async () => {
      const mockCategory = {
        id: 1,
        name: 'Test Category',
        slug: 'test-category',
        is_active: 1,
      };

      getQuery.mockResolvedValue(mockCategory);

      const category = await Category.findBySlug('test-category');

      expect(category).toBeInstanceOf(Category);
      expect(category.slug).toBe('test-category');
    });
  });

  describe('getTree', () => {
    it('должен построить дерево категорий', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Parent',
          parent_id: null,
          icon_url: null,
        },
        {
          id: 2,
          name: 'Child',
          parent_id: 1,
          icon_url: null,
        },
      ];

      getAllQuery
        .mockResolvedValueOnce(mockCategories) // findAll
        .mockResolvedValue(null); // getFirstProductImage

      const tree = await Category.getTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
    });
  });

  describe('buildTree', () => {
    it('должен построить иерархическое дерево', () => {
      const categories = [
        { id: 1, name: 'Parent', parentId: null },
        { id: 2, name: 'Child', parentId: 1 },
      ];

      const tree = Category.buildTree(categories);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe(2);
    });
  });

  describe('update', () => {
    it('должен обновить категорию', async () => {
      runQuery.mockResolvedValue({ changes: 1 });

      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const result = await Category.update(1, updateData);

      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  describe('delete', () => {
    it('должен выбросить ошибку при наличии подкатегорий', async () => {
      getAllQuery.mockResolvedValue([{ id: 2, name: 'Child' }]);

      await expect(Category.delete(1)).rejects.toThrow('Нельзя удалить категорию');
    });

    it('должен удалить категорию без подкатегорий', async () => {
      getAllQuery.mockResolvedValue([]); // нет подкатегорий
      runQuery.mockResolvedValue({ changes: 1 });

      const result = await Category.delete(1);

      expect(runQuery).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  describe('generateSlug', () => {
    it('должен транслитерировать кириллицу', () => {
      const slug = Category.generateSlug('Смартфоны');
      expect(slug).toContain('smartfony');
    });

    it('должен обрабатывать обычный текст', () => {
      const slug = Category.generateSlug('Test Category');
      expect(slug).toBe('test-category');
    });

    it('должен обрабатывать пустую строку', () => {
      const slug = Category.generateSlug('');
      expect(slug).toBe('');
    });
  });
});
