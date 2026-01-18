import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          家計簿アプリ
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI駆動のダッシュボードで家計を分析
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          ダッシュボードを開く
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">自然言語で分析</h3>
          <p className="text-gray-600">
            「今月の食費を円グラフで見せて」のように自然な言葉で家計を分析できます
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">リアルタイム可視化</h3>
          <p className="text-gray-600">
            円グラフ、棒グラフ、折れ線グラフなど、様々な形式でデータを可視化
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">ダッシュボード保存</h3>
          <p className="text-gray-600">
            お気に入りのダッシュボードを保存して、いつでもすぐにアクセス
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4">使い方</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-600">
          <li>ダッシュボードページに移動</li>
          <li>分析したい内容を自然な言葉で入力（例：「今月のカテゴリ別支出を円グラフで」）</li>
          <li>AIがリクエストを解析し、適切なグラフやテーブルを生成</li>
          <li>気に入ったダッシュボードは保存して後から再利用</li>
        </ol>
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <h2 className="text-xl font-bold text-blue-800 mb-3">サンプルリクエスト</h2>
        <ul className="space-y-2 text-blue-700">
          <li>「今月の支出を円グラフで見せて」</li>
          <li>「先月と今月の支出を比較して」</li>
          <li>「カテゴリ別の支出推移を折れ線グラフで」</li>
          <li>「今月の支出明細を日付順で表示」</li>
          <li>「食費と交通費を棒グラフで比較」</li>
        </ul>
      </div>
    </div>
  );
}
