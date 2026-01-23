require('dotenv').config();

const { createApp } = require('./app');
const { initializeDatabase } = require('./config/database');

const PORT = process.env.PORT || 5001;

// Инициализация базы данных
initializeDatabase();

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌍 Режим: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
