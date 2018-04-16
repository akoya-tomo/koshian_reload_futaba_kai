## KOSHIAN リロード拡張 改
このFirefoxアドオンはふたば☆ちゃんねるでページ更新せずに新着レスを取得・マウスホイールでリロードできる[Pachira](https://addons.mozilla.org/ja/firefox/user/anonymous-a0bba9187b568f98732d22d51c5955a6/)氏の[KOSHIAN リロード拡張](https://addons.mozilla.org/ja/firefox/addon/koshian-reload-futaba/)アドオンを改変したものです。  
リロード時に既読レスの情報を更新する機能などをオリジナル版に追加しています。  

※このアドオンはWebExtensionアドオン対応のFirefox専用となります。  
※他のこしあんアドオン改変版やUserscriptは[こちら](https://github.com/akoya-tomo/futaba_auto_reloader_K/wiki/)の一覧からどうぞ。  

## 機能
* オリジナルの機能（KOSHIAN リロード拡張）
  - 画面端で一定回数マウスホイールをスクロールすることでふたば☆ちゃんねるのカタログやスレをリロード
  - スレ画面でページを更新することなく新着レスを取得
* 追加された機能（KOSHIAN リロード拡張 改）
  - リロード時にページ下段のスレ消滅時刻を更新  
    リロード時に最新のスレ消滅時刻を取得してページ下段の表示を書き換えます。  
    スレがもうすぐ消える時は時刻の文字が赤色になります。  
  - リロード時に既読レスの削除情報を更新（デフォルト：無効）  
    削除された既読レスを赤破線で囲み、削除理由を赤字で追記します。  
  - リロード時に既読レスのそうだねの情報を更新（デフォルト：無効）  
    既読レスのそうだねの数字を更新します。  
  - リロード時に既読レスのID表示情報を更新（デフォルト：無効）  
    既読レスのID表示情報を更新します。IDカウンター[（WebExtensions版）](http://toshiakisp.github.io/akahuku-firefox-sp/#others)・[（userscript版）](https://github.com/toshiakisp/idcounter-userscript/)または[futaba ID+IP popup](https://greasyfork.org/ja/scripts/8189-futaba-id-ip-popup/)との併用も可能です。  
  - リロード時にスレが消えていたらポータルサイト[ふたポ](http://futapo.futakuro.com/)\(futapo\)の過去ログ\(kako.futakuro.com\)へのリンクを表示（二次元裏may・imgのみ）（デフォルト：無効）  
    設定画面で有効にするとスレ消滅の表示の横にリンクが表示されます。  
  - カタログでリロード時にページ先頭に移動（デフォルト：無効）  
    カタログページでリロードしたときにページ先頭へ移動します。  

## インストール
[GitHub](https://github.com/akoya-tomo/koshian_reload_futaba_kai/releases/download/v1.4.1/koshian_reload_futaba_kai-1.4.1-an.fx.xpi)

※「接続エラーのため、アドオンをダウンロードできませんでした。」と表示されてインストール出来ないときはリンクを右クリックしてxpiファイルをダウンロードし、メニューのツール→アドオン（またはCtrl+Shift+A）で表示されたアドオンマネージャーのページにxpiファイルをドラッグ＆ドロップして下さい。  

## 追加機能について
* 既読レスのID情報は表示されたときのみ更新されます。その後IDが消えても画面上では表示されたままです。  
* 赤破線の削除レスを隠したいときは、スレ本文の下にある「削除された記事がx件あります」の横の「隠す」ボタンを押すと新着の削除レスと一緒に隠すことができます。  
* 新着レスが削除されていたときは赤破線は表示されません。  
* 新着レスがしばらく無いスレはスレ消滅時刻が赤字にならないで消えることがあります。（imgで良く発生します）  

## 注意事項
* このアドオンはWebExtensionアドオン対応のFirefox専用です。  
* 本アドオンを有効にしたときはオリジナル版を無効にするか削除して下さい。  
* オリジナル版とは別アドオンなので設定は初期値に戻ります。  
  再度設定をお願い致します。  

## 更新履歴
* v1.4.1 2018-04-16
  - 削除レスがあるのに「削除された記事がx件あります」が表示されないことがある不具合を修正
  - 削除された新着レスが[見る]ボタンで表示されない不具合（v1.3.0以降で発生）を修正
* v1.4.0 2018-04-08
  - 削除情報の更新にスレ爆破失敗を追加
  - 2chin閉鎖により2chinへのリンク表示機能を削除
* v1.3.0 2018-03-27
  - リロード時に既読レスのID表示情報を更新する機能を追加
  - 既読レスの削除理由に「なー」が表示されない不具合を修正
  - カタログでリロード時にページ先頭に移動する機能を追加
  - スレ消滅時にふたポの過去ログへのリンクを表示する機能を追加（may・imgのみ）
  - アドオンの自動更新を有効化
* v1.2.0 2018-01-08
  - リロード時に既読レスの削除情報を更新する機能を追加
  - リロード時に既読レスのそうだねの情報を更新する機能を追加
  - 2chinへのリンク表示がリロードで増えるバグを修正
* v1.1.0 2018-01-05
  - リロード時にスレ消滅なら2chinへのリンク表示する機能を追加（may・imgのみ）
* v1.0.0 2017-12-16
  - KOSHIAN リロード拡張 v1.3.5ベース
  - リロード時にスレ下段のスレ消滅時刻を更新する機能を追加
