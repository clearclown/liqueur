# **Project Liquid: 企画構想書**

## **1\. プロジェクト概要**

**Project Liquid** は、あらゆるWeb APIバックエンド（Rust, Python, Go等）に対して、**「AIによる動的UI生成機能（Generative UI）」** を安全かつ低コストに追加するためのプロトコルおよびSDKスイートです。

特に reinhardt-web (Rust) をリファレンス実装とし、エンタープライズグレードの堅牢性とAIの柔軟性を融合させた **「Headless AI Frontend Layer」** を提供します。

## **2\. 解決する課題**

### **ユーザーの課題**

* **「帯に短し襷に長し」:** SaaSの標準ダッシュボードでは、自社固有のKPI分析や特殊なワークフローに対応できない。  
* **エンジニア依存:** 画面のちょっとした変更や集計軸の変更を、都度エンジニアに依頼しなければならない。

### **開発者の課題**

* **AI実装のリスク:** AIにSQLやJSを書かせると、セキュリティリスク（インジェクション）やハルシネーション（嘘データ）の制御が困難。  
* **実装コスト:** Vercel v0のような「対話型UI生成」を自前で実装するには、膨大な工数がかかる。

## **3\. 提供価値 (Value Proposition)**

1. Zero-Code Customization for Users:  
   ユーザーは自然言語で「旅行費を除いた経費推移が見たい」と伝えるだけで、システムが即座にUIとクエリを生成・実行する。  
2. Safety & Robustness for Developers:  
   AIの出力は「Liquid Protocol（JSON）」に限定され、バックエンドのORM/型システムによって厳密に検証されるため、システムを破壊しない。  
3. Backend Agnostic:  
   プロトコルベースの設計により、バックエンドの言語を問わず導入可能（初期はRust reinhardt-web に最適化）。

## **4\. プロダクト構成**

### **A. Core Protocol (liquid-protocol)**

* AI、フロントエンド、バックエンドが会話するためのJSONスキーマ仕様。  
* UIコンポーネント定義（Layout, Charts, Tables）と、抽象データクエリ定義（Filter, Aggregation）。  
* npmパッケージおよびRustクレートとして提供。

### **B. Frontend SDK (@liquid-ui/react)**

* React/Next.js向けのレンダリングエンジン。  
* Liquid ProtocolのJSONを受け取り、RechartsやTailwind CSSを用いて描画するコンポーネント群。  
* AIエージェントとの通信（Streaming）を管理するフック。

### **C. Backend Adapters**

* **liquid-reinhardt (Rust):** reinhardt-web 用のアダプター。Protocolのクエリを reinhardt-db のクエリビルダに変換。  
* *(Future)* liquid-fastapi (Python), liquid-gin (Go) 等。

## **5\. ターゲットユーザー**

* **Primary:** 業務システム、Adminパネル、B2B SaaSを開発するエンジニア。  
* **End User:** 上記システムを利用し、自分専用の分析やビューを必要とするビジネスユーザー。

## **6\. ロードマップ**

* **Phase 1: Protocol & MVP (Current)**  
  * liquid-protocol の策定。  
  * reinhardt-web 上での概念実証（静的JSONによるレンダリング）。  
* **Phase 2: AI Integration**  
  * Next.js \+ Vercel AI SDK を用いたチャットUIの実装。  
  * AIによるJSON生成プロンプトの最適化。  
* **Phase 3: Persistence & Sharing**  
  * 生成されたArtifact（UI設定）をDBに保存し、チームで共有する機能。