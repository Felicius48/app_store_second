import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">iTexnika</h3>
            <p className="text-gray-300">
              Интернет-магазин техники с доставкой по всей стране.
            </p>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4">Категории</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white">Смартфоны</a></li>
              <li><a href="#" className="hover:text-white">Ноутбуки</a></li>
              <li><a href="#" className="hover:text-white">Аксессуары</a></li>
              <li><a href="#" className="hover:text-white">Телевизоры</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4">Клиентам</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white">Доставка</a></li>
              <li><a href="#" className="hover:text-white">Оплата</a></li>
              <li><a href="#" className="hover:text-white">Возврат</a></li>
              <li><a href="#" className="hover:text-white">Поддержка</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4">Контакты</h4>
            <div className="text-gray-300 space-y-2">
              <p>📞 +7 (999) 123-45-67</p>
              <p>✉️ support@techstore.ru</p>
              <p>📍 Самара, ул.Высоцкого, д.6</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 @ iTexnika Информация на сайте не является публичной офертой</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
