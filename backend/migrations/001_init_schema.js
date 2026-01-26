exports.up = async function up(knex) {
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('phone');
      table.string('address');
      table.string('city');
      table.string('postal_code');
      table.string('avatar_url');
      table.string('role').defaultTo('user');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasCategories = await knex.schema.hasTable('categories');
  if (!hasCategories) {
    await knex.schema.createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('slug').unique().notNullable();
      table.text('description');
      table.string('image_url');
      table.string('icon_url');
      table.integer('parent_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasBrands = await knex.schema.hasTable('brands');
  if (!hasBrands) {
    await knex.schema.createTable('brands', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('slug').unique().notNullable();
      table.string('logo_url');
      table.text('description');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) {
    await knex.schema.createTable('products', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('slug').unique().notNullable();
      table.text('description');
      table.text('short_description');
      table.decimal('price', 10, 2).notNullable();
      table.decimal('sale_price', 10, 2);
      table.string('sku').unique();
      table.integer('stock_quantity').defaultTo(0);
      table.string('stock_status').defaultTo('in_stock');
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
      table.integer('brand_id').unsigned().references('id').inTable('brands').onDelete('SET NULL');
      table.decimal('weight', 5, 2);
      table.text('dimensions');
      table.text('images');
      table.boolean('is_featured').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.string('seo_title');
      table.text('seo_description');
      table.text('specifications');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasReviews = await knex.schema.hasTable('reviews');
  if (!hasReviews) {
    await knex.schema.createTable('reviews', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('rating').notNullable();
      table.string('title');
      table.text('comment');
      table.boolean('is_verified').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasOrders = await knex.schema.hasTable('orders');
  if (!hasOrders) {
    await knex.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('order_number').unique().notNullable();
      table.string('status').defaultTo('pending');
      table.decimal('total_amount', 10, 2).notNullable();
      table.decimal('shipping_amount', 10, 2).defaultTo(0);
      table.decimal('discount_amount', 10, 2).defaultTo(0);
      table.decimal('tax_amount', 10, 2).defaultTo(0);
      table.string('currency').defaultTo('RUB');
      table.text('shipping_address').notNullable();
      table.text('billing_address');
      table.string('payment_method').defaultTo('card');
      table.string('payment_status').defaultTo('pending');
      table.string('shipping_method');
      table.text('notes');
      table.string('payment_id');
      table.text('payment_confirmation_url');
      table.timestamp('payment_paid_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasOrderItems = await knex.schema.hasTable('order_items');
  if (!hasOrderItems) {
    await knex.schema.createTable('order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.integer('quantity').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.decimal('total', 10, 2).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasCart = await knex.schema.hasTable('cart');
  if (!hasCart) {
    await knex.schema.createTable('cart', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('session_id');
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.integer('quantity').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.unique(['user_id', 'product_id']);
      table.unique(['session_id', 'product_id']);
    });
  }

  const hasCoupons = await knex.schema.hasTable('coupons');
  if (!hasCoupons) {
    await knex.schema.createTable('coupons', (table) => {
      table.increments('id').primary();
      table.string('code').unique().notNullable();
      table.string('discount_type').notNullable();
      table.decimal('discount_value', 10, 2).notNullable();
      table.decimal('min_order_amount', 10, 2);
      table.decimal('max_discount', 10, 2);
      table.integer('usage_limit');
      table.integer('used_count').defaultTo(0);
      table.timestamp('expiry_date');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasProductCategories = await knex.schema.hasTable('product_categories');
  if (!hasProductCategories) {
    await knex.schema.createTable('product_categories', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.integer('category_id').unsigned().notNullable().references('id').inTable('categories').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['product_id', 'category_id']);
    });
  }

  const hasFavorites = await knex.schema.hasTable('favorites');
  if (!hasFavorites) {
    await knex.schema.createTable('favorites', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['user_id', 'product_id']);
    });
  }

  const hasSettings = await knex.schema.hasTable('site_settings');
  if (!hasSettings) {
    await knex.schema.createTable('site_settings', (table) => {
      table.string('key').primary();
      table.text('value');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('site_settings');
  await knex.schema.dropTableIfExists('favorites');
  await knex.schema.dropTableIfExists('product_categories');
  await knex.schema.dropTableIfExists('coupons');
  await knex.schema.dropTableIfExists('cart');
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('brands');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
};
