# ヨット点数計算表

## アプリの概要
Androidのホーム画面に追加して使える、個人利用向けPWAです。ダイスゲーム「ヨット」の点数入力、上段小計、ボーナス、総合得点を計算します。

## ファイル構成
- index.html
- style.css
- script.js
- manifest.json
- service-worker.js
- icons/icon-192.png
- icons/icon-512.png

## Android Chromeでの開き方
1. ファイル一式をHTTPS対応サーバー、またはローカルサーバーへ配置します。
2. Android Chromeでindex.htmlを開きます。

## ホーム画面への追加方法
1. Android Chromeでアプリを開きます。
2. 右上のメニューを開きます。
3. 「ホーム画面に追加」または「アプリをインストール」を選びます。
4. 追加後、ホーム画面のアイコンから起動します。

## オフライン利用方法
一度Android Chromeで開くと、必要ファイルがキャッシュされます。その後は通信なしでも起動できます。

## 更新方法
ファイルを差し替えた後、service-worker.jsのCACHE_NAMEを変更してください。

## キャッシュ削除方法
Android Chromeのサイト設定から、このアプリのストレージを削除してください。

## よくあるトラブル
- ホーム画面追加が出ない：HTTPSまたはローカルサーバーで開いてください。
- 更新されない：Chromeのサイトデータを削除するか、service-worker.jsのCACHE_NAMEを変更してください。
- オフラインで開けない：一度オンラインでアプリを開いてください。
