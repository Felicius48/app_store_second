const express = require('express');

const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const categoryRoutes = require('./categories');
const reviewRoutes = require('./reviews');
const adminRoutes = require('./admin');
const paymentRoutes = require('./payments');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
