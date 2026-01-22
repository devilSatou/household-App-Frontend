import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { Category, CategoryType } from '../types';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カテゴリの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const openModal = () => {
    setNewCategoryName('');
    setNewCategoryType('expense');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCategoryName('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiClient.createCategory({
        name: newCategoryName,
        type: newCategoryType,
      });
      closeModal();
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カテゴリの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">カテゴリ管理</h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          + 新規カテゴリ
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-800">支出カテゴリ</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {expenseCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                カテゴリがありません
              </div>
            ) : (
              expenseCategories.map((category) => (
                <div key={category.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                    <span className="text-gray-900">{category.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Income Categories */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <h2 className="text-lg font-semibold text-green-800">収入カテゴリ</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {incomeCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                カテゴリがありません
              </div>
            ) : (
              incomeCategories.map((category) => (
                <div key={category.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                    <span className="text-gray-900">{category.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">デフォルトカテゴリについて</h3>
        <p className="text-sm text-blue-700">
          初回登録時に、よく使われる支出カテゴリ（食費、日用品、交通費など12種類）と
          収入カテゴリ（給与、副業、投資など4種類）が自動的に作成されます。
        </p>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={closeModal}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">新規カテゴリ</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    種別
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={newCategoryType === 'expense'}
                        onChange={(e) => setNewCategoryType(e.target.value as CategoryType)}
                        className="mr-2"
                      />
                      <span className="text-red-600">支出</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={newCategoryType === 'income'}
                        onChange={(e) => setNewCategoryType(e.target.value as CategoryType)}
                        className="mr-2"
                      />
                      <span className="text-green-600">収入</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリ名
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 趣味"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? '作成中...' : '作成'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
