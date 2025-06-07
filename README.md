# Atack25 4色オセロWebアプリ

このプロジェクトはHTML・CSS・JavaScriptで構成された「Attack25風 4色オセロ」Webアプリの開発環境です。

## 特徴
- 5×5盤面・赤青緑白の4色オセロ
- 盤面ロジック・UIデザイン調整済み
- クイズ出題（カテゴリ・難易度選択、答え表示）
- クイズ作成・登録（Web画面からquiz-data.jsonに追記）
- 依存パッケージ管理（npm, package-lock.json）

## 使い方

1. 必要に応じて `npm install` で依存パッケージをインストール
2. `node proxy.js` でサーバーを起動（クイズ登録機能を使う場合）
3. `index.html` をブラウザで開く
4. クイズ作成は画面右下の「クイズを作成する」ボタンから

## 構成
- `index.html`: メインHTMLファイル
- `src/css/style.css`: スタイルシート
- `src/js/script.js`: 盤面・クイズ出題ロジック
- `create-quiz.html`: クイズ作成画面
- `src/js/create-quiz.js`: クイズ作成画面用JS
- `quiz-data.json`: カテゴリ・問題データ設定ファイル
- `proxy.js`: クイズ登録APIサーバー（Node.js/Express）
- `package.json`, `package-lock.json`: 依存管理

## 必要条件
- モダンなWebブラウザ
- Node.js（クイズ登録機能を使う場合）

## 注意
- APIキーや機密情報は含まれていません
- クイズ登録機能はローカル環境でのみ動作します
