import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { MonthlySummary, CategorySummary, Transaction } from '../types';

const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

export function MonthlyReport() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const fetchYearData = useCallback(async (year: number) => {
    setIsLoading(true);
    setError('');
    setExpandedMonth(null);
    setCategorySummary([]);
    setMonthTransactions([]);
    try {
      const res = await apiClient.getYearlySummary(year);
      const data = res.monthly || [];
      // Fill all 12 months, using zeros for months without data
      const filled: MonthlySummary[] = Array.from({ length: 12 }, (_, i) => {
        const found = data.find((s) => s.month === i + 1);
        return found || { year, month: i + 1, income: 0, expense: 0, balance: 0 };
      });
      setMonthlySummaries(filled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYearData(selectedYear);
  }, [selectedYear, fetchYearData]);

  const handleMonthClick = async (month: number) => {
    if (expandedMonth === month) {
      setExpandedMonth(null);
      return;
    }
    setExpandedMonth(month);
    setIsDetailLoading(true);
    setCategorySummary([]);
    setMonthTransactions([]);

    const startDate = `${selectedYear}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, month, 0).getDate();
    const endDate = `${selectedYear}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    try {
      const [catRes, txRes] = await Promise.all([
        apiClient.getCategorySummary(startDate, endDate),
        apiClient.getTransactions({ start_date: startDate, end_date: endDate, limit: 100 }),
      ]);
      setCategorySummary(catRes.data || []);
      setMonthTransactions(txRes.data || []);
    } catch {
      // Detail fetch failure is non-critical, just show empty
    } finally {
      setIsDetailLoading(false);
    }
  };

  const yearTotal = monthlySummaries.reduce(
    (acc, s) => ({
      income: acc.income + s.income,
      expense: acc.expense + s.expense,
      balance: acc.balance + s.balance,
    }),
    { income: 0, expense: 0, balance: 0 }
  );

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
      {/* Header with year selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">月別レポート</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          >
            &larr;
          </button>
          <span className="text-lg font-semibold text-gray-900 min-w-[5rem] text-center">
            {selectedYear}年
          </span>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Yearly totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">年間収入</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {formatCurrency(yearTotal.income)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">年間支出</div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {formatCurrency(yearTotal.expense)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">年間収支</div>
          <div className={`mt-2 text-3xl font-bold ${yearTotal.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(yearTotal.balance)}
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">月</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">収入</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">支出</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">収支</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {monthlySummaries.map((summary) => (
              <MonthRow
                key={summary.month}
                summary={summary}
                isExpanded={expandedMonth === summary.month}
                isDetailLoading={isDetailLoading && expandedMonth === summary.month}
                expenseCategories={expandedMonth === summary.month ? expenseCategories : []}
                incomeCategories={expandedMonth === summary.month ? incomeCategories : []}
                transactions={expandedMonth === summary.month ? monthTransactions : []}
                formatCurrency={formatCurrency}
                onClick={() => handleMonthClick(summary.month)}
              />
            ))}
            {/* Yearly total row */}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-6 py-3 text-sm text-gray-900">合計</td>
              <td className="px-6 py-3 text-sm text-right text-green-600">{formatCurrency(yearTotal.income)}</td>
              <td className="px-6 py-3 text-sm text-right text-red-600">{formatCurrency(yearTotal.expense)}</td>
              <td className={`px-6 py-3 text-sm text-right ${yearTotal.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(yearTotal.balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthRow({
  summary,
  isExpanded,
  isDetailLoading,
  expenseCategories,
  incomeCategories,
  transactions,
  formatCurrency,
  onClick,
}: {
  summary: MonthlySummary;
  isExpanded: boolean;
  isDetailLoading: boolean;
  expenseCategories: CategorySummary[];
  incomeCategories: CategorySummary[];
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
  onClick: () => void;
}) {
  const hasData = summary.income > 0 || summary.expense > 0;

  return (
    <>
      <tr
        onClick={onClick}
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50' : ''}`}
      >
        <td className="px-6 py-4 text-sm font-medium text-gray-900">
          {MONTH_LABELS[summary.month - 1]}
          {isExpanded ? ' ▼' : hasData ? ' ▶' : ''}
        </td>
        <td className="px-6 py-4 text-sm text-right text-green-600">
          {summary.income > 0 ? formatCurrency(summary.income) : '-'}
        </td>
        <td className="px-6 py-4 text-sm text-right text-red-600">
          {summary.expense > 0 ? formatCurrency(summary.expense) : '-'}
        </td>
        <td className={`px-6 py-4 text-sm text-right font-medium ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
          {hasData ? formatCurrency(summary.balance) : '-'}
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-gray-50">
            {isDetailLoading ? (
              <div className="text-center text-gray-500 py-4">読み込み中...</div>
            ) : (
              <div className="space-y-4">
                {/* Category breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenseCategories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">支出カテゴリ</h4>
                      <div className="space-y-1">
                        {expenseCategories.map((cat) => (
                          <div key={cat.category_id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{cat.category_name}</span>
                            <span className="text-red-600">{formatCurrency(cat.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {incomeCategories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">収入カテゴリ</h4>
                      <div className="space-y-1">
                        {incomeCategories.map((cat) => (
                          <div key={cat.category_id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{cat.category_name}</span>
                            <span className="text-green-600">{formatCurrency(cat.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {expenseCategories.length === 0 && incomeCategories.length === 0 && (
                    <div className="text-sm text-gray-500">この月のデータはありません</div>
                  )}
                </div>

                {/* Transaction list */}
                {transactions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">取引一覧</h4>
                    <div className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="px-4 py-2 flex justify-between items-center text-sm">
                          <div>
                            <span className="text-gray-900">{tx.category?.name || 'カテゴリなし'}</span>
                            <span className="text-gray-400 ml-2">
                              {new Date(tx.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                            </span>
                            {tx.memo && <span className="text-gray-400 ml-2">{tx.memo}</span>}
                          </div>
                          <span className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
