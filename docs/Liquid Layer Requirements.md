# **要件定義書: Liquid Layer**

## **1\. システム全体構成**

システムは以下の3層で構成される **Server-Driven UI (SDUI)** アーキテクチャを採用する。

1. **Frontend Layer (Consumer):** Next.jsアプリケーション。AIとの対話と、JSONからのUIレンダリングを担当。  
2. **Protocol Layer (Interface):** liquid-protocol。UIとデータクエリを記述するJSONスキーマ。  
3. **Backend Layer (Provider):** reinhardt-web (Rust)。スキーマの検証、データの取得、権限管理を担当。

## **2\. 機能要件 (Functional Requirements)**

### **2.1 AIによるスキーマ生成 (Generation)**

* **FR-01:** ユーザーの自然言語入力を受け取り、LiquidView スキーマ（JSON）を生成すること。  
* **FR-02:** 生成プロセスにおいて、システムはAIに対し「使用可能なリソース（モデル定義）」と「許可されたコンポーネント」をメタデータとして提示すること。  
* **FR-03:** AIは実行可能なコード（JS/SQL）を含まず、純粋なJSONデータのみを出力すること。

### **2.2 スキーマの検証と解釈 (Validation & Interpretation)**

* **FR-04:** バックエンドは受信したJSONを厳密な型（Rust Struct）にデシリアライズし、構造的な正当性を検証すること。  
* **FR-05:** 定義されていないフィールドや、許可されていない集計操作が含まれる場合、エラーを返却すること（Fail Fast）。

### **2.3 安全なデータ取得 (Secure Data Access)**

* **FR-06:** スキーマ内の DataSource 定義（フィルタ、ソート、集計）を、reinhardt-db 等のORMクエリに変換して実行すること。  
* **FR-07:** クエリ実行時には必ず実行ユーザーのコンテキスト（CurrentUser）を適用し、Row-Level Security（行レベルセキュリティ）を強制すること。

### **2.4 UIレンダリング (Rendering)**

* **FR-08:** フロントエンドは LiquidView JSONを再帰的に解析し、対応するReactコンポーネント（Grid, Chart, Table等）にマッピングして表示すること。  
* **FR-09:** データ取得が完了するまでの間、適切なローディング状態（Skeleton）を表示すること。

### **2.5 永続化 (Persistence)**

* **FR-10:** ユーザーが気に入った生成結果（スキーマ）を、名前をつけて保存できること。  
* **FR-11:** 保存されたスキーマは、次回以降AIを介さずに即座にロード・表示できること。

## **3\. 非機能要件 (Non-Functional Requirements)**

### **3.1 セキュリティ (Security)**

* **NFR-01:** **No Arbitrary Code Execution.** AI生成物に起因するXSSおよびSQLインジェクションをアーキテクチャレベルで防ぐ。  
* **NFR-02:** **Least Privilege.** AIはユーザーが持つ権限以上の情報を決して引き出せないこと。

### **3.2 パフォーマンス (Performance)**

* **NFR-03:** 保存済みスキーマのロードから表示までのレイテンシは、通常の静的ページと同等であること（バックエンドでの事前コンパイル等の最適化）。

### **3.3 拡張性 (Extensibility)**

* **NFR-04:** 新しいUIコンポーネント（例: カレンダー、ガントチャート）を追加する際、プロトコルの拡張のみで対応可能であること。  
* **NFR-05:** バックエンドの実装言語を問わず、プロトコルを実装すれば利用可能であること。

## **4\. データ構造定義 (Draft Protocol)**

### **Liquid View Schema**

{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 2
  },
  "components": \[
    {
      "type": "chart",
      "variant": "bar",
      "title": "Monthly Expenses",
      "data\_source": "ds\_expenses\_monthly"
    }
  \],
  "data\_sources": {
    "ds\_expenses\_monthly": {
      "resource": "expenses",
      "aggregation": { "type": "sum", "field": "amount", "by": "month" },
      "filters": \[
        { "field": "category", "op": "neq", "value": "travel" }
      \]
    }
  }
}  
