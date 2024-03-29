## <sub><img src="koshian_reload_futaba/icons/icon-48.png"></sub> KOSHIAN リロード拡張 改
このFirefoxアドオンはふたば☆ちゃんねるでマウスホイールでリロードできる[Pachira](https://addons.mozilla.org/ja/firefox/user/anonymous-a0bba9187b568f98732d22d51c5955a6/)氏の[KOSHIAN リロード拡張](https://addons.mozilla.org/ja/firefox/addon/koshian-reload-futaba/)の非公式改変版です。  
リロード時に既読レスの情報を更新する機能などをオリジナル版に追加しています。  

※このアドオンはWebExtensionアドオン対応のFirefox専用となります。  
※他のKOSHIAN改変版などのふたば支援ツールは[こちら](https://github.com/akoya-tomo/futaba_auto_reloader_K/wiki/)。  

## 機能
* オリジナルの機能（KOSHIAN リロード拡張）
  - ページ上下端で一定回数マウスホイールをスクロールでカタログやスレをリロード
* 追加された機能（KOSHIAN リロード拡張 改）
  - ![\(New\)](images/new.png "New") レス送信モードのリロード方式を「全文取得」「差分取得」で切り替え（デフォルト：全文取得）  
    全文取得（転送量 大）：既読レスの削除・ID表示情報更新有り  
    差分取得（転送量 小）：既読レスの削除・ID表示情報更新無し  
  - リロード時に既読レスの情報を更新（「全文取得」モードのみ）  
    既読レスの削除・ID表示の情報を更新します。  
    IDカウンター[（WebExtensions版）](http://toshiakisp.github.io/akahuku-firefox-sp/#others)・[（userscript版）](https://github.com/toshiakisp/idcounter-userscript/)または[futaba ID+IP popup](https://greasyfork.org/ja/scripts/8189-futaba-id-ip-popup/)との併用も可能です。  
  - リロード時にスレが消えていたらログサイトへのリンクを表示（デフォルト：無効）  
    スレ消滅の表示の横に過去ログへのリンクが表示されます。  
  - カタログでリロード時にページ先頭に移動（デフォルト：無効）  
    カタログ画面でリロードしたときにページ先頭へ移動します。  
  - F5キーのリロードを置き換える（デフォルト：無効）  
    F5キーによるリロードを新着レス取得やカタログ更新に置き換えます。  
  - カタログ画面でページの再読み込み無しでカタログを更新  
    カタログのリロード方式を「カタログのみ」に設定することでページを再読み込みせずにカタログを更新することができます。  
    「多順」「勢順」などのソートもページの再読み込み無しで切り替えできます。  
    \[UNDO\]ボタンでリロード前に戻すこともできます。  
  - 「カタログのソートのデフォルトをレス増加順にする」オプション（デフォルト：無効　要 [KOSHIAN カタログマーカー 改](https://github.com/akoya-tomo/koshian_catalog_marker_kai/)）  
    カタログを最初にリロードしたときにスレをレス増加順に並び替えます。\[通常順\]\[増加順\]ボタンで切り替えできます。  
    カタログのリロード方式が「カタログのみ」のときに有効です。  
  - 「削除されたレスを表示する」オプション（デフォルト：有効）  
    デフォルトで非表示になっている削除されたレスを表示します。  
    「削除された記事がx件あります.」の横のボタンで表示・非表示を切り替えできます。  
    ![\(New\)](images/new.png "New") 「差分取得」モードではスレを開いたときに削除されたレスがあるときのみ有効です。  

## インストール
**GitHub**  
[![インストールボタン](images/install_button.png "クリックでアドオンをインストール")](https://github.com/akoya-tomo/koshian_reload_futaba_kai/releases/download/v2.7.0/koshian_reload_futaba_kai-2.7.0-fx.xpi)

※ふたば以外にスレ登録型ログサイトのアクセス許可が要求されます。（該当スレのログの有無の確認）  
※「接続エラーのため、アドオンをダウンロードできませんでした。」と表示されてインストール出来ないときはリンクを右クリックしてxpiファイルをダウンロードし、メニューのツール→アドオン（またはCtrl+Shift+A）で表示されたアドオンマネージャーのページにxpiファイルをドラッグ＆ドロップして下さい。  

## 追加機能の補足
* 既読レスのID情報は表示されたときのみ更新されます。その後IDが消えても画面上では表示されたままです。  
* レス本文内の赤字のIP情報については更新対象外です。  
* スレ登録型ログサイトは該当スレのログがあるときだけリンクが表示されます。  
* 「ホイールリロード規制中」の表示が消えたら規制が解除されています。また、カタログリロード後の「更新完了」の表示が消えたらホイールリロード規制が解除されています。  
* カタログのレス増加順ソートはカタログのリロード方式が「カタログのみ」で本アドオンのリロード機能を使用時のみ有効です。ブラウザでページ更新したときはソートされません。  
* ![\(New\)](images/new.png "New") レス送信モードのリロード方式を切り替えたら開いているスレを一度再読み込みしてください。  

## 注意事項
* 本アドオンを有効にしたときはオリジナル版を無効にするか削除して下さい。  
* オリジナル版とは別アドオンなので設定は初期値に戻ります。  
  再度設定をお願い致します。  
* 本アドオンと以下のアドオン・ユーザースクリプトを併用する場合は記載のバージョンの組み合わせでご利用ください。  
  尚、オリジナル版のKOSHIAN カタログマーカー・KOSHIAN カタログの画像をポップアップで表示・futaba thread highlighterはカタログのリロード方式が「カタログのみ」のときに動作しなくなりました。代替として下のアドオン・ユーザースクリプトをご利用ください。  

  - [KOSHIAN カタログマーカー 改](https://github.com/akoya-tomo/koshian_catalog_marker_kai/) v2.2.0以降
  - [KOSHIAN カタログの画像をポップアップで表示 改](https://github.com/akoya-tomo/koshian_image_popuper_kai/) v1.6.2以降
  - [futaba thread highlighter K](https://greasyfork.org/ja/scripts/36639-futaba-thread-highlighter-k) v1.6.6rev23以降 \(GreasyFork\)
  - [futaba catalog NG](https://greasyfork.org/ja/scripts/37565-futaba-catalog-ng) v1.6.6以降 \(GreasyFork\)

* カタログのリロード方式が「カタログのみ」のとき、スレのプルダウンメニューは最初にカタログを開いたときの項目で固定になります。  
  「見歴から削除」や「履歴から削除」を表示させたいときは「見歴」「履歴」のリンクを新しいタブで開くか、カタログのリロード方式を「ページ全体」にしてください。

## ライセンス
* スレのプルダウンメニューボタン設置の処理でふたば☆ちゃんねるのcat.jsのコードの一部を改変して使用しています。  

## 更新履歴
* v2.7.0 2021-04-13
  - レス送信モードのリロード方式を「全文取得」と「差分取得」で選択できるように変更
  - 既読レスの更新の各オプションを全文取得モード時は常時有効にして廃止
  - ホイールリロードのカウント数判定を修正
  - ログサイトを更新
* v2.6.3 2020-04-15
  - カタログのリロードでプルダウンメニューボタン設置中にエラーになる不具合を修正
* v2.6.2 2020-04-15
  - ログサイトを更新
* v2.6.1 2020-03-10
  - カタログリロード時にプルダウンメニューを消去するように修正
* v2.6.0 2020-03-03
  - カタログのリロード方式が「カタログのみ」でもスレのプルダウンメニューボタンを設置するように修正
* v2.5.1 2020-02-21
  - 削除された既読レスの情報が更新されない不具合を修正
* v2.5.0 2020-01-21
  - カタログのリロード方式を「ページ全体」と「カタログのみ」で選択できるように変更
  - ID表示の情報が更新されない不具合を修正
* v2.4.0 2019-11-11
  - 新レイアウトのカタログに暫定対応
    - 新レイアウトではホイールリロードのみ動作します。
* v2.3.4 2019-10-23
  - Firefox 71以降で既読レスの削除情報の更新がエラーになる不具合を修正
  - カタログのレス増加順ソートボタンの位置を右揃えから中央揃えに変更
* v2.3.3 2019-10-16
  - Firefox 71以降で新着レスが取得できない不具合を修正
* v2.3.2 2019-09-05
  - ID・IP表示板の検出漏れの不具合を修正
* v2.3.1 2019-08-20
  - ID・IPスレの検出の不具合を修正
  - 新着レスおよび更新カタログの既存ページへの挿入方法を修正
* v2.3.0 2019-08-10
  - \[通常順\]\[増加順\]ボタンを追加
  - オプション名を「レス増加順にソートする」→「カタログのソートのデフォルトをレス増加順にする」に変更
  - UNDOしたときに前回の更新時刻を表示するように修正
  - ホイールリロードの条件を修正
* v2.2.2 2019-06-09
  - ホイールリロードのカウント条件を修正
* v2.2.1 2019-06-07
  - 新着レス取得と既読レス情報更新のリロード速度を改善
  - 「削除されたレスを表示する」オプションを追加
  - その他細かい修正とコードの整理
* v2.1.0 2019-05-20
  - 「カタログをレス増加順にソートする」オプションを追加（要 KOSHIAN カタログマーカー 改）
  - ページ更新せずに「多順」「勢順」などに切り替えできるように修正
* v2.0.0 2019-05-17
  - カタログをページ更新せずにリロードするように修正
  - リロード中に背景色を変えるオプションを追加
  - Ctrl + F5キーによるリロードを新着レス取得に置き換えないように修正
  - ホイールリロード規制が解除されたら「規制中」の表示を消すように修正
* v1.10.0 2019-05-04
  - 全てのスレ登録型ログサイトで該当スレのログが無いときはリンクを表示しないように修正
* v1.9.0 2019-05-02
  - 一部のスレ登録型ログサイトで該当スレのログが無いときはリンクを表示しないように修正
* v1.8.0 2019-04-26
  - ログサイトを追加
* v1.7.2 2019-03-05
  - Firefox 66以降でリロード時に最終レスにスクロールすることがある不具合を修正
* v1.7.1 2018-11-02
  - レイアウト変更に伴いスレ消滅時刻の取得を修正
* v1.7.0 2018-07-28
  - [KOSHIAN 返信フォーム拡張 改](https://github.com/akoya-tomo/koshian_form_futaba_kai/) v0.2.0以降で返信中にリロードを抑制するように修正
  - コード整理
* v1.6.2 2018-06-29
  - フレーム表示のカタログで動作するように修正
  - ページ下端の検出を修正
  - ホイールリロード規制中に解除までの残り時間を表示するように修正
* v1.6.1 2018-06-14
  - 「以前のリロードからxミリ秒以内なら行わない」でリロード抑制したときは「ホイールリロード規制中」にメッセージを変更
  - スレ消滅メッセージとスレ消滅直前の消滅時刻を赤字・太字に変更
  - その他細かい修正とコードの整理
* v1.6.0 2018-06-14
  - [futaba auto reloader K](https://greasyfork.org/ja/scripts/36235-futaba-auto-reloader-k) rev6の新機能への対応
* v1.5.1 2018-06-12
  - スレが落ちたときのメッセージを修正
* v1.5.0 2018-05-02
  - F5キーをページ更新無しの新着レス取得に置き換えるオプション追加
* v1.4.2 2018-04-28
  - スレ本文に自動リンクが含まれているとスレ爆破失敗と誤認識する不具合を修正
  - スレの最終更新日時の確認方法を修正
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
