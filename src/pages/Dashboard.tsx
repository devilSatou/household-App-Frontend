import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Transaction, MonthlySummary, CategorySummary } from '../types';

export function Dashboard() {
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [monthlyRes, categoryRes, transactionsRes] = await Promise.all([
          apiClient.getMonthlySummary(),
          apiClient.getCategorySummary(),
          apiClient.getTransactions({ limit: 5 }),
        ]);

        // Get current month summary
        const now = new Date();
        const currentMonth = monthlyRes.data?.find(
          (s) => s.year === now.getFullYear() && s.month === now.getMonth() + 1
        );
        setMonthlySummary(currentMonth || { year: now.getFullYear(), month: now.getMonth() + 1, income: 0, expense: 0, balance: 0 });
        setCategorySummary(categoryRes.data || []);
        setRecentTransactions(transactionsRes.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        {error}
      </div>
    );
  }

  const expenseCategories = categorySummary.filter((c) => c.type === 'expense');
  const incomeCategories = categorySummary.filter((c) => c.type === 'income');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">今月の収入</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {formatCurrency(monthlySummary?.income || 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">今月の支出</div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {formatCurrency(monthlySummary?.expense || 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">収支</div>
          <div className={`mt-2 text-3xl font-bold ${(monthlySummary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(monthlySummary?.balance || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">最近の取引</h2>
            <Link to="/transactions" className="text-sm text-blue-600 hover:text-blue-500">
              すべて表示
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTransactions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                取引がありません
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {transaction.category?.name || 'カテゴリなし'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(transaction.date)}
                      {transaction.memo && ` - ${transaction.memo}`}
                    </div>
                  </div>
                  <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">カテゴリ別内訳</h2>
          </div>
          <div className="p-4 space-y-4">
            {expenseCategories.length === 0 && incomeCategories.length === 0 ? (
              <div className="text-center text-gray-500">
                データがありません
              </div>
            ) : (
              <>
                {expenseCategories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">支出</h3>
                    <div className="space-y-2">
                      {expenseCategories.slice(0, 5).map((cat) => (
                        <div key={cat.category_id} className="flex justify-between items-center">
                          <span className="text-gray-700">{cat.category_name}</span>
                          <span className="text-red-600 font-medium">
                            {formatCurrency(cat.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {incomeCategories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">収入</h3>
                    <div className="space-y-2">
                      {incomeCategories.slice(0, 5).map((cat) => (
                        <div key={cat.category_id} className="flex justify-between items-center">
                          <span className="text-gray-700">{cat.category_name}</span>
                          <span className="text-green-600 font-medium">
                            {formatCurrency(cat.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/transactions?action=add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            + 新規取引
          </Link>
          <Link
            to="/categories"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
          >
            カテゴリ管理
          </Link>
        </div>
      </div>
    </div>
  );
}
