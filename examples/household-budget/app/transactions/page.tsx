'use client';

import { useState, useEffect, useRef } from 'react';

interface Transaction {
  id: string;
  date: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description: string | null;
  category: {
    name: string;
    color: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME';
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    categoryId: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });
      if (!res.ok) throw new Error('Failed to add transaction');

      setShowAddForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        categoryId: '',
        amount: '',
        description: '',
      });
      fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この取引を削除しますか？')) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete transaction');
      fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting transaction');
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }

      const result = await res.json();
      alert(`${result.imported}件のデータをインポートしました`);
      fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">取引一覧</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            ref={fileInputRef}
            className="hidden"
            id="csv-import"
          />
          <label
            htmlFor="csv-import"
            className={`btn btn-secondary cursor-pointer ${importing ? 'opacity-50' : ''}`}
          >
            {importing ? 'インポート中...' : 'CSVインポート'}
          </label>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            {showAddForm ? 'キャンセル' : '+ 新規追加'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">&times;</button>
        </div>
      )}

      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">新規取引を追加</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">日付</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">種類</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as 'EXPENSE' | 'INCOME',
                    categoryId: ''
                  })}
                  className="input w-full"
                >
                  <option value="EXPENSE">支出</option>
                  <option value="INCOME">収入</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">カテゴリ</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">選択してください</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">金額</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input w-full"
                  placeholder="1000"
                  min="0"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">説明（任意）</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                placeholder="メモを入力"
              />
            </div>
            <button type="submit" className="btn btn-primary">追加</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <strong>CSVフォーマット:</strong> date,type,category,amount,description<br />
          例: 2026-01-15,expense,食費,3500,スーパーでの買い物
        </div>

        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">取引データがありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">日付</th>
                  <th className="text-left py-2 px-3">種類</th>
                  <th className="text-left py-2 px-3">カテゴリ</th>
                  <th className="text-right py-2 px-3">金額</th>
                  <th className="text-left py-2 px-3">説明</th>
                  <th className="text-center py-2 px-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{formatDate(tx.date)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.type === 'INCOME'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.type === 'INCOME' ? '収入' : '支出'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: tx.category.color ? `${tx.category.color}20` : '#f3f4f6',
                          color: tx.category.color || '#374151'
                        }}
                      >
                        {tx.category.name}
                      </span>
                    </td>
                    <td className={`py-2 px-3 text-right font-mono ${
                      tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-2 px-3 text-gray-600">{tx.description || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
