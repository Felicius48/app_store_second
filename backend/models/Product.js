const { runQuery, getQuery, getAllQuery } = require('../config/database');

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.description = data.description;
    this.shortDescription = data.short_description;
    this.price = parseFloat(data.price);
    this.salePrice = data.sale_price ? parseFloat(data.sale_price) : null;
    this.sku = data.sku;
    this.stockQuantity = data.stock_quantity;
    this.stockStatus = data.stock_status;
    this.categoryId = data.category_id;
    this.brandId = data.brand_id;
    this.weight = data.weight ? parseFloat(data.weight) : null;
    this.dimensions = data.dimensions ? JSON.parse(data.dimensions) : null;
    this.images = data.images ? JSON.parse(data.images) : [];
    this.specifications = data.specifications ? JSON.parse(data.specifications) : {};
    this.isFeatured = Boolean(data.is_featured);
    this.isActive = Boolean(data.is_active);
    this.seoTitle = data.seo_title;
    this.seoDescription = data.seo_description;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Создание товара
  static async create(productData) {
    const {
      name, description, shortDescription, price, salePrice, sku,
      stockQuantity, categoryId, categoryIds, brandId, weight, dimensions, images,
      specifications, isFeatured, seoTitle, seoDescription
    } = productData;

    // Генерация slug из названия
    const slug = this.generateSlug(name);

    // Поддержка обратной совместимости: если передан categoryId, используем его
    const finalCategoryId = categoryIds && categoryIds.length > 0 ? categoryIds[0] : categoryId;

    const sql = `
      INSERT INTO products (
        name, slug, description, short_description, price, sale_price, sku,
        stock_quantity, category_id, brand_id, weight, dimensions, images,
        specifications, is_featured, seo_title, seo_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Правильная обработка specifications: если передан объект (даже пустой), сохраняем его
    let specificationsValue = JSON.stringify({});
    if (specifications !== undefined && specifications !== null) {
      if (typeof specifications === 'object') {
        specificationsValue = JSON.stringify(specifications);
      } else if (typeof specifications === 'string') {
        // Если уже строка, проверяем, что это валидный JSON
        try {
          JSON.parse(specifications);
          specificationsValue = specifications;
        } catch (e) {
          specificationsValue = JSON.stringify({});
        }
      }
    }

    const params = [
      name, slug, description, shortDescription, price, salePrice, sku,
      stockQuantity, finalCategoryId, brandId, weight,
      dimensions ? JSON.stringify(dimensions) : null,
      images ? JSON.stringify(images) : JSON.stringify([]),
      specificationsValue,
      isFeatured ? 1 : 0, seoTitle, seoDescription
    ];

    try {
      const result = await runQuery(sql, params);
      const productId = result.id;

      // Добавляем связи с категориями (многие-ко-многим)
      if (categoryIds && categoryIds.length > 0) {
        await this.setCategories(productId, categoryIds);
      } else if (categoryId) {
        await this.setCategories(productId, [categoryId]);
      }

      return { id: productId, message: 'Товар успешно создан' };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Товар с таким названием или SKU уже существует');
      }
      throw error;
    }
  }

  // Установка категорий для товара
  static async setCategories(productId, categoryIds) {
    // Удаляем существующие связи
    await runQuery('DELETE FROM product_categories WHERE product_id = ?', [productId]);
    
    // Добавляем новые связи
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await runQuery(
          'INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
          [productId, categoryId]
        );
      }
    }
  }

  // Получение категорий товара
  static async getCategories(productId) {
    const sql = `
      SELECT c.*
      FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ? AND c.is_active = 1
      ORDER BY c.name
    `;
    return await getAllQuery(sql, [productId]);
  }

  // Поиск товара по ID
  static async findById(id) {
    const sql = `
      SELECT p.*,
             c.name as category_name,
             b.name as brand_name,
             p.specifications
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ? AND p.is_active = 1
    `;
    const product = await getQuery(sql, [id]);
    if (!product) return null;
    
    const productObj = new Product(product);
    // Загружаем все категории товара
    productObj.categories = await this.getCategories(id);
    return productObj;
  }

  // Поиск товара по slug
  static async findBySlug(slug) {
    const sql = `
      SELECT p.*,
             c.name as category_name,
             b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = ? AND p.is_active = 1
    `;
    const product = await getQuery(sql, [slug]);
    return product ? new Product(product) : null;
  }

  // Получение товаров с фильтрами
  static async findAll(options = {}) {
    const {
      categoryId, categoryIds, brandId, minPrice, maxPrice, search, featured,
      inStock, limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'DESC'
    } = options;

    let sql = `
      SELECT p.*,
             c.name as category_name,
             b.name as brand_name,
             p.specifications,
             AVG(r.rating) as average_rating,
             COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN reviews r ON p.id = r.product_id AND r.is_active = 1
      WHERE p.is_active = 1
    `;

    const params = [];

    // Фильтры по категориям
    if (categoryIds && categoryIds.length > 0) {
      // Используем подзапрос для поиска товаров с любым из указанных категорий
      const placeholders = categoryIds.map(() => '?').join(',');
      sql += ` AND EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.id 
        AND pc.category_id IN (${placeholders})
      )`;
      params.push(...categoryIds);
    } else if (categoryId) {
      // Поддержка обратной совместимости: ищем по category_id или в product_categories
      sql += ` AND (p.category_id = ? OR EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.id 
        AND pc.category_id = ?
      ))`;
      params.push(categoryId, categoryId);
    }

    if (brandId) {
      sql += ' AND p.brand_id = ?';
      params.push(brandId);
    }

    if (minPrice !== undefined) {
      sql += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      sql += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (featured) {
      sql += ' AND p.is_featured = 1';
    }

    if (inStock) {
      sql += ' AND p.stock_status = "in_stock" AND p.stock_quantity > 0';
    }

    sql += ' GROUP BY p.id';

    // Сортировка
    const validSortFields = ['name', 'price', 'created_at', 'average_rating'];
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';

    sql += ` ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const products = await getAllQuery(sql, params);
    // Загружаем категории для каждого товара
    const productsWithCategories = await Promise.all(
      products.map(async (productData) => {
        const product = new Product(productData);
        product.categories = await this.getCategories(product.id);
        return product;
      })
    );
    return productsWithCategories;
  }

  // Подсчет количества товаров
  static async count(options = {}) {
    const { categoryId, categoryIds, brandId, minPrice, maxPrice, search, featured, inStock } = options;

    let sql = 'SELECT COUNT(DISTINCT p.id) as count FROM products p WHERE p.is_active = 1';
    const params = [];

    // Применение тех же фильтров
    if (categoryIds && categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',');
      sql += ` AND EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.id 
        AND pc.category_id IN (${placeholders})
      )`;
      params.push(...categoryIds);
    } else if (categoryId) {
      sql += ` AND (p.category_id = ? OR EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.id 
        AND pc.category_id = ?
      ))`;
      params.push(categoryId, categoryId);
    }

    if (brandId) {
      sql += ' AND brand_id = ?';
      params.push(brandId);
    }

    if (minPrice !== undefined) {
      sql += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      sql += ' AND price <= ?';
      params.push(maxPrice);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (featured) {
      sql += ' AND is_featured = 1';
    }

    if (inStock) {
      sql += ' AND stock_status = "in_stock" AND stock_quantity > 0';
    }

    const result = await getQuery(sql, params);
    return result.count;
  }

  // Обновление товара
  static async update(id, updateData) {
    const {
      name, description, shortDescription, price, salePrice, sku,
      stockQuantity, categoryId, categoryIds, brandId, weight, dimensions, images,
      specifications, isFeatured, seoTitle, seoDescription
    } = updateData;

    let slug = null;
    if (name) {
      slug = this.generateSlug(name);
    }

    // Поддержка обратной совместимости
    const finalCategoryId = categoryIds && categoryIds.length > 0 ? categoryIds[0] : categoryId;

    const sql = `
      UPDATE products SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        short_description = COALESCE(?, short_description),
        price = COALESCE(?, price),
        sale_price = ?,
        sku = COALESCE(?, sku),
        stock_quantity = COALESCE(?, stock_quantity),
        category_id = COALESCE(?, category_id),
        brand_id = COALESCE(?, brand_id),
        weight = ?,
        dimensions = ?,
        images = ?,
        specifications = COALESCE(?, specifications),
        is_featured = COALESCE(?, is_featured),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    // Правильная обработка specifications: если передан объект (даже пустой), сохраняем его
    let specificationsValue = null;
    if (specifications !== undefined && specifications !== null) {
      if (typeof specifications === 'object') {
        specificationsValue = JSON.stringify(specifications);
      } else if (typeof specifications === 'string') {
        // Если уже строка, проверяем, что это валидный JSON
        try {
          JSON.parse(specifications);
          specificationsValue = specifications;
        } catch (e) {
          specificationsValue = JSON.stringify({});
        }
      }
    }

    const params = [
      name, slug, description, shortDescription, price, salePrice, sku,
      stockQuantity, finalCategoryId, brandId, weight,
      dimensions ? JSON.stringify(dimensions) : null,
      images ? JSON.stringify(images) : null,
      specificationsValue,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      seoTitle, seoDescription, id
    ];

    await runQuery(sql, params);

    // Обновляем связи с категориями, если переданы categoryIds
    if (categoryIds !== undefined) {
      await this.setCategories(id, categoryIds);
    } else if (categoryId !== undefined) {
      await this.setCategories(id, [categoryId]);
    }

    return { message: 'Товар успешно обновлен' };
  }

  // Удаление товара (мягкое удаление)
  static async delete(id) {
    const sql = 'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await runQuery(sql, [id]);
    return { message: 'Товар удален' };
  }

  // Генерация slug из названия
  static generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Получение текущей цены (с учетом скидки)
  getCurrentPrice() {
    return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
  }

  // Проверка доступности товара
  isAvailable() {
    return this.isActive && this.stockStatus === 'in_stock' && this.stockQuantity > 0;
  }

  // Получение публичных данных товара
  toPublicData() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      shortDescription: this.shortDescription,
      price: this.price,
      salePrice: this.salePrice,
      currentPrice: this.getCurrentPrice(),
      sku: this.sku,
      stockQuantity: this.stockQuantity,
      stockStatus: this.stockStatus,
      categoryId: this.categoryId,
      categoryName: this.category_name,
      categoryIds: this.categories ? this.categories.map(c => c.id) : (this.categoryId ? [this.categoryId] : []),
      categories: this.categories ? this.categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })) : [],
      brandId: this.brandId,
      brandName: this.brand_name,
      weight: this.weight,
      dimensions: this.dimensions,
      images: this.images,
      specifications: this.specifications,
      isFeatured: this.isFeatured,
      isAvailable: this.isAvailable(),
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription,
      createdAt: this.createdAt,
      averageRating: this.average_rating ? parseFloat(this.average_rating) : null,
      reviewCount: this.review_count || 0
    };
  }
}

module.exports = Product;
