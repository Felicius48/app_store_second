const { runQuery, getQuery, getAllQuery } = require('../config/database');

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.description = data.description;
    this.imageUrl = data.image_url;
    this.iconUrl = data.icon_url;
    this.parentId = data.parent_id;
    this.isActive = Boolean(data.is_active);
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Создание категории
  static async create(categoryData) {
    const { name, description, imageUrl, iconUrl, parentId } = categoryData;

    // Генерация базового slug
    let baseSlug = this.generateSlug(name);
    if (!baseSlug) {
      baseSlug = `category-${Date.now()}`;
    }
    let slug = baseSlug;

    const sql = `
      INSERT INTO categories (name, slug, description, image_url, icon_url, parent_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await runQuery(sql, [name, slug, description, imageUrl, iconUrl, parentId]);
      return { id: result.id, message: 'Категория успешно создана' };
    } catch (error) {
      // Если slug уже занят, пробуем добавить суффикс и повторить попытку
      if (error.message.includes('UNIQUE constraint failed')) {
        // Пробуем несколько вариантов slug с суффиксом
        for (let i = 2; i <= 50; i++) {
          const newSlug = `${baseSlug}-${i}`;
          try {
            const result = await runQuery(sql, [name, newSlug, description, imageUrl, iconUrl, parentId]);
            return { id: result.id, message: 'Категория успешно создана' };
          } catch (e) {
            if (!e.message.includes('UNIQUE constraint failed')) {
              throw e;
            }
            // если снова конфликт, продолжаем цикл
          }
        }
        // Если не удалось подобрать уникальный slug
        throw new Error('Категория с таким названием уже существует');
      }
      throw error;
    }
  }

  // Поиск по ID
  static async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ? AND is_active = 1';
    const category = await getQuery(sql, [id]);
    return category ? new Category(category) : null;
  }

  // Поиск по slug
  static async findBySlug(slug) {
    const sql = 'SELECT * FROM categories WHERE slug = ? AND is_active = 1';
    const category = await getQuery(sql, [slug]);
    return category ? new Category(category) : null;
  }

  // Получение всех категорий
  static async findAll(options = {}) {
    const { parentId, limit = 50, offset = 0 } = options;

    let sql = 'SELECT * FROM categories WHERE is_active = 1';
    const params = [];

    if (parentId !== undefined) {
      if (parentId === null) {
        sql += ' AND parent_id IS NULL';
      } else {
        sql += ' AND parent_id = ?';
        params.push(parentId);
      }
    }

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const categories = await getAllQuery(sql, params);
    return categories.map(category => new Category(category));
  }

  // Получение дерева категорий
  static async getTree() {
    const categories = await this.findAll();
    const enriched = await Promise.all(
      categories.map(async (category) => {
        const data = category.toPublicData();
        if (!data.iconUrl) {
          data.sampleImage = await this.getFirstProductImage(category.id);
        }
        return data;
      })
    );
    return this.buildTree(enriched);
  }

  // Построение дерева категорий
  static buildTree(categories) {
    const categoryMap = {};
    const roots = [];

    // Создаем карту всех категорий
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] };
    });

    // Строим дерево
    categories.forEach(category => {
      if (category.parentId) {
        if (categoryMap[category.parentId]) {
          categoryMap[category.parentId].children.push(categoryMap[category.id]);
        }
      } else {
        roots.push(categoryMap[category.id]);
      }
    });

    return roots;
  }

  // Обновление категории
  static async update(id, updateData) {
    const { name, description, imageUrl, iconUrl, parentId } = updateData;

    const sql = `
      UPDATE categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        icon_url = COALESCE(?, icon_url),
        parent_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await runQuery(sql, [name, description, imageUrl, iconUrl, parentId, id]);
    return { message: 'Категория успешно обновлена' };
  }

  static async getFirstProductImage(categoryId) {
    const sql = `
      SELECT p.images
      FROM products p
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      WHERE p.is_active = 1
        AND (p.category_id = ? OR pc.category_id = ?)
      ORDER BY p.created_at DESC
      LIMIT 1
    `;
    const row = await getQuery(sql, [categoryId, categoryId]);
    if (!row?.images) return null;
    try {
      const images = JSON.parse(row.images);
      return Array.isArray(images) && images.length > 0 ? images[0] : null;
    } catch (e) {
      return null;
    }
  }

  // Удаление категории (вместе с товарами, связанными с ней)
  static async delete(id) {
    // Проверка наличия подкатегорий
    const children = await this.findAll({ parentId: id });
    if (children.length > 0) {
      throw new Error('Нельзя удалить категорию, у которой есть подкатегории');
    }

    // Удаляем (мягко) все товары, связанные с этой категорией через product_categories или поле category_id
    try {
      const Product = require('./Product');

      // Находим товары, связанные через таблицу связей многие-ко-многим
      const productIdsFromLinkTable = await getAllQuery(
        'SELECT DISTINCT product_id as id FROM product_categories WHERE category_id = ?',
        [id]
      );

      // Находим товары, у которых основная category_id совпадает (обратная совместимость)
      const productIdsFromField = await getAllQuery(
        'SELECT id FROM products WHERE category_id = ? AND is_active = 1',
        [id]
      );

      const productIdSet = new Set();
      productIdsFromLinkTable.forEach((row) => productIdSet.add(row.id));
      productIdsFromField.forEach((row) => productIdSet.add(row.id));

      for (const productId of productIdSet) {
        await Product.delete(productId);
      }
    } catch (e) {
      // Если по какой-то причине не удалось загрузить Product или выполнить запрос,
      // не блокируем удаление категории, но логируем ошибку.
      console.error('Ошибка при удалении товаров категории:', e);
    }

    const sql = 'UPDATE categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await runQuery(sql, [id]);
    return { message: 'Категория удалена вместе с товарами' };
  }

  // Генерация slug
  static generateSlug(name) {
    const map = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
      и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
      с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh',
      щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
    };

    const normalized = String(name || '')
      .trim()
      .toLowerCase()
      .split('')
      .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
      .join('');

    return normalized
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Получение публичных данных
  toPublicData() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      imageUrl: this.imageUrl,
      iconUrl: this.iconUrl,
      parentId: this.parentId,
      createdAt: this.createdAt
    };
  }
}

module.exports = Category;
