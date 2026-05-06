# 工事前写真一覧PDF作成アプリ

スマホから写真をアップロードし、工務店へ送るための「工事前写真一覧.pdf」を作成するGitHub Pages対応のWebアプリです。

このアプリはブラウザ内でPDFを作成します。写真はブラウザ内で処理され、サーバーへ保存されません。

## ファイル構成

- `index.html`: GitHub Pagesで表示する画面
- `static/app.js`: PDF作成処理
- `.nojekyll`: GitHub Pages用設定
- `template.xlsx`, `app.py`, `excel_generator.py`, `requirements.txt`: 以前のExcel版を残す場合の参考ファイル

## ローカルでの起動方法

GitHub Pages版は静的サイトですが、ローカル確認時は簡易サーバー経由で開いてください。

プログラミング未経験の方は、`start_preview.bat` をダブルクリックしてください。確認用のブラウザ画面が自動で開きます。確認が終わったら、開いた黒い画面でEnterを押すと終了できます。

```bash
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開くと、写真アップロード画面が表示されます。

## 写真アップロード方法

1. 利用者名、住所を入力します。
2. 「写真をアップロード」からスマホ内の写真を複数選択します。
3. 写真の撮影日を入力します。入力した日付は全写真の右下にオレンジ色で入ります。
4. 写真ごとに「工事箇所」「工事内容」「寸法」を入力します。
5. 「PDF作成」を押します。

## PDF出力方法

「PDF作成」を押すと、自動的に `工事前写真一覧.pdf` のダウンロードが始まります。

PDFはブラウザ内で1ページずつ画像として固定して作るため、文字化けやレイアウト崩れが起きにくいです。工務店へそのまま送る用途ではPDF出力がおすすめです。

## GitHub Pagesへの公開方法

1. このフォルダをGitHubなどのGitリポジトリに保存します。
2. `index.html`, `static/app.js` を含めてpushします。
3. GitHubのリポジトリ画面で `Settings` を開きます。
4. `Pages` を開きます。
5. `Build and deployment` の `Source` で `Deploy from a branch` を選びます。
6. `Branch` は `main`、フォルダは `/root` を選びます。
7. 保存後、表示されるGitHub PagesのURLを開きます。

GitHub PagesではPythonやStreamlitは動きません。このため、公開版は `index.html` と `static/app.js` だけで動く構成にしています。

## セキュリティ

アップロードされた写真はブラウザ内だけで扱います。GitHub Pagesや外部サーバーに写真を保存しません。
