# **The Philosophy of Liquid Architecture**

**From Static to Liquid: AI時代のソフトウェア構築論**

## **1\. The Paradigm Shift (パラダイムシフト)**

ソフトウェアの歴史は「抽象化」と「自動化」の歴史でした。しかし、**User Interface (UI)** の構築に関しては、過去20年間、本質的なパラダイムは変わっていません。

* **これまで (Static SaaS):** 開発者が想定したユースケースに基づき、固定された画面、固定された機能、固定されたワークフローをユーザーに提供する。「カスタマイズ」は、開発者が用意した無数のチェックボックスをオンオフすることに過ぎませんでした。  
* これから (Liquid SaaS):  
  AI（LLM）の台頭により、ソフトウェアはユーザーの文脈（Context）と意図（Intent）に合わせて、実行時にその姿を液体のように変化させることが可能になります。ユーザーは「機能を使う」のではなく、「目的を伝える」だけで良くなります。

## **2\. The "Artifact" Centric Model**

私たちは、AIが生成するものを単なる「テキスト」や「チャット」として扱いません。  
ClaudeのArtifactやGeminiのCanvasが示したように、AIの出力は 「編集可能で、実行可能で、永続的な構造化データ（Artifact）」 であるべきです。  
このフレームワークにおいて、ダッシュボードの一つ、レポートの一つ一つが Artifact です。  
Artifactはコードではなく、意図の純粋な定義（Schema） です。

## **3\. Security by Design (制約による自由)**

AIに「自由」を与えすぎると、システムは壊れ、セキュリティは崩壊します（Hallucination, Prompt Injection）。  
私たちの哲学は 「AIにはコードを書かせない」 ことです。

* **Strict Schema:** AIはRustで定義された厳格な型システム（Schema）の範囲内でのみ創造を許されます。  
* **Safe Execution:** 生成されたスキーマは、Rustの堅牢なバックエンドによって検証され、安全なクエリへと変換されます。

「何でもできる（JavaScriptを生成して実行する）」自由ではなく、**「定義された安全なパーツを自由に組み合わせられる」自由**を提供します。

## **4\. Developer Experience First**

「ユーザーが自由に画面を作れる」ことは、開発者が苦労することを意味してはなりません。  
Liquid Architectureは、開発者にとっても革命的であるべきです。

* **Backend Agnostic:** 既存のRust, Python, Goのバックエンド資産をそのまま活かせること。  
* **Protocol Oriented:** 言語間の壁をJSON Schemaという共通言語で取り払うこと。

私たちは、AI時代の「Django」や「Rails」を作ろうとしています。それは、AIと人間が共創するための、最も安全で高速な基盤です。