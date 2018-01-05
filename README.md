## KOSHIAN リロード拡張 改
このアドオンは[Pachira](https://addons.mozilla.org/ja/firefox/user/anonymous-a0bba9187b568f98732d22d51c5955a6/)氏の[KOSHIAN リロード拡張](https://addons.mozilla.org/ja/firefox/addon/koshian-reload-futaba/)アドオンを改変したものです。  
リロード時にページ下段のスレ消滅時刻を更新する機能などをオリジナル版に追加しています。  

※他のKOSHIANアドオン改変版やUserscriptは[こちら](https://github.com/akoya-tomo/futaba_auto_reloader_K/wiki)の一覧からどうぞ。  

## 機能
* オリジナルの機能（KOSHIAN リロード拡張）
  - 画面端で一定回数マウスホイールでスクロールすることでふたば☆ちゃんねるのカタログやレス画面をリロードします
  - レス画面ではページを更新することなく新着レスを取得できます
* 追加された機能（KOSHIAN リロード拡張 改）
  - リロード時にページ下段のスレ消滅時刻を更新する機能  
    リロード時に最新のスレ消滅時刻を取得してページ下段の表示を書き換えます。  
    スレがもうすぐ消える時は時刻の文字が赤色になります。  
  - \(v1.1\)リロード時にスレが消えていたらログサイト[ふたば☆ちん](http://www.2chin.net/)\(2chin\)へのリンクを表示（二次元裏may・imgのみ）  
    設定画面で有効にするとスレ消滅の表示の横に2chinへのリンクが表示されます。（デフォルト：無効）  

## インストール
[GitHub](https://github.com/akoya-tomo/koshian_reload_futaba_kai/releases/download/v1.1.0/koshian_reload_futaba_kai-1.1.0-an.fx.xpi)

## 注意事項
* 新着レスが無い時は本文を取得しないので時刻は更新されません。  
* ページ上部の時刻は更新されません。  
* オリジナル版とは別アドオンなので設定は初期値に戻ります。  
  再度設定をお願い致します。  

## 更新履歴
* v1.1.0 2018-01-05
  - リロード時にスレ消滅なら2chinへのリンク表示する機能を追加（may・imgのみ）
* v1.0.0 2017-12-16
  - KOSHIAN リロード拡張 v1.3.5ベース
  - リロード時にスレ下段のスレ消滅時刻を更新する機能を追加
