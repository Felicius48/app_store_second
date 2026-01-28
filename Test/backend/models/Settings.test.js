const Settings = require('../../../backend/models/Settings');
const { runQuery, getQuery, getAllQuery } = require('../../../backend/config/database');

jest.mock('../../../backend/config/database');

describe('Settings Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getValue', () => {
    it('должен получить значение настройки по ключу', async () => {
      getQuery.mockResolvedValue({ value: 'test-value' });

      const value = await Settings.getValue('test-key');

      expect(getQuery).toHaveBeenCalledWith(
        'SELECT value FROM site_settings WHERE key = ?',
        ['test-key']
      );
      expect(value).toBe('test-value');
    });

    it('должен вернуть null если настройка не найдена', async () => {
      getQuery.mockResolvedValue(null);

      const value = await Settings.getValue('nonexistent-key');

      expect(value).toBeNull();
    });
  });

  describe('setValue', () => {
    it('должен установить значение настройки', async () => {
      runQuery.mockResolvedValue({});

      await Settings.setValue('test-key', 'test-value');

      expect(runQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO site_settings'),
        ['test-key', 'test-value']
      );
    });

    it('должен обновить существующую настройку', async () => {
      runQuery.mockResolvedValue({});

      await Settings.setValue('existing-key', 'updated-value');

      const sql = runQuery.mock.calls[0][0];
      expect(sql).toContain('ON CONFLICT');
    });
  });

  describe('getAll', () => {
    it('должен вернуть все настройки', async () => {
      const mockSettings = [
        { key: 'key1', value: 'value1', updated_at: '2024-01-01' },
        { key: 'key2', value: 'value2', updated_at: '2024-01-02' },
      ];

      getAllQuery.mockResolvedValue(mockSettings);

      const settings = await Settings.getAll();

      expect(getAllQuery).toHaveBeenCalledWith(
        'SELECT key, value, updated_at FROM site_settings'
      );
      expect(settings).toHaveLength(2);
    });
  });
});
