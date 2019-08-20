/**
 * 本文無しリスト
 * @const {Array.<RegExp>} no_comment_list 各板の本文無しの正規表現の配列
 */
const no_comment_list = [
    /^ｷﾀ━+\(ﾟ∀ﾟ\)━+ *!+$/,
    /^本文無し$/
];

const DEFAULT_SCROLL_PERIOD = 500;
const DEFAULT_COUNT_TO_RELOAD = 10;
const DEFAULT_RELOAD_PERIOD = 5000;
const DEFAULT_TIME_OUT = 60000;
const DEFAULT_REPLACE_RELOAD_BUTTON = true;
const DEFAULT_REPLACE_F5_KEY = false;
const DEFAULT_CHANGE_BG_COLOR = false;
const DEFAULT_SHOW_DELETED_RES = true;
const DEFAULT_REFRESH_DELETED_RES = true;
const DEFAULT_REFRESH_SOUDANE = true;
const DEFAULT_REFRESH_IDIP = true;
const DEFAULT_USE_FUTAPO_LINK = false;
const DEFAULT_USE_FTBUCKET_LINK = false;
const DEFAULT_USE_TSUMANNE_LINK = false;
let scroll_period = DEFAULT_SCROLL_PERIOD;
let count_to_reload = DEFAULT_COUNT_TO_RELOAD;
let reload_period = DEFAULT_RELOAD_PERIOD;
let time_out = DEFAULT_TIME_OUT;
let replace_reload_button = DEFAULT_REPLACE_RELOAD_BUTTON;
let replace_f5_key = DEFAULT_REPLACE_F5_KEY;
let change_bg_color = DEFAULT_CHANGE_BG_COLOR;
let show_deleted_res = DEFAULT_SHOW_DELETED_RES;
let refresh_deleted_res = DEFAULT_REFRESH_DELETED_RES;
let refresh_soudane = DEFAULT_REFRESH_SOUDANE;
let refresh_idip = DEFAULT_REFRESH_IDIP;
let use_futapo_link = DEFAULT_USE_FUTAPO_LINK;
let use_ftbucket_link = DEFAULT_USE_FTBUCKET_LINK;
let use_tsumanne_link = DEFAULT_USE_TSUMANNE_LINK;
let is_idip_thread = checkThreadMail();
let ddbut_clicked = false;
let tsumanne_loading = false;
let ftbucket_loading = false;
let timer_notify = null;
let timer_submit = null;
let reloading_start_time = null;  // eslint-disable-line no-unused-vars

class Notify {
    constructor() {
        this.thre = document.getElementsByClassName("thre")[0];

        if (Notify.hasNotify()) {
            this.notify = document.getElementById("KOSHIAN_NOTIFY");
            this.text = (function (parent) {
                for (let node = parent.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType == Node.TEXT_NODE) {
                        return node;
                    }
                }

                return parent.appendChild(document.createTextNode(""));
            })(this.notify);

            this.separator = this.notify.getElementsByTagName("hr");
        } else {
            this.notify = document.createElement("span");
            this.text = document.createTextNode("");
            this.separator = document.createElement("hr");

            this.notify.id = "KOSHIAN_NOTIFY";
            this.notify.appendChild(this.separator);
            this.notify.appendChild(this.text);
            document.body.appendChild(this.notify);

            this.moveTo();
        }
    }

    setText(text, color = "", font_weight = "") {
        if (timer_notify) {
            clearTimeout(timer_notify);
            timer_notify = null;
        }
        this.text.textContent = text;
        this.notify.style.color = color;
        this.notify.style.fontWeight = font_weight;
    }

    setAlarmText(text) {
        if (timer_notify) {
            clearTimeout(timer_notify);
            timer_notify = null;
        }
        this.text.textContent = text;
        this.notify.style.color = "red";
        this.notify.style.fontWeight = "bold";
    }

    getText() {
        return {
            text: this.text.textContent,
            color: this.notify.style.color,
            font_weight: this.notify.style.fontWeight
        };
    }

    moveTo(target = null) {
        if (target) {
            this.thre.insertBefore(this.notify, target.nextElementSibling);
        } else {
            this.thre.appendChild(this.notify);
        }
    }

    static hasNotify() {
        return document.getElementById("KOSHIAN_NOTIFY");
    }
}

class Reloader {
    constructor() {
        this.notify = new Notify();
        this.loading = false;
        this.last_reload_time = getTime();
        this.last_mod = null;
        this.new_mod = null;
        this.last_etag = null;
        this.new_etag = null;
        this.thread_not_found = false;
        this.form_submit = false;
    }

    reload(force = false) {
        if (this.loading || this.form_submit) {
            return;
        }

        let cur = getTime();

        if (!force && cur - this.last_reload_time < reload_period) {
            if (!timer_notify && !this.thread_not_found) {   // ホイールリロード規制中表示とスレ消滅メッセージ表示を優先
                let time = reload_period - cur + this.last_reload_time;
                let notify_text = this.notify.getText();
                this.notify.setText(`ホイールリロード規制中（あと${time}msec）`);
                timer_notify = setTimeout(() => {
                    timer_notify = null;
                    this.notify.setText(notify_text.text || "　　", notify_text.color, notify_text.font_weight);
                    last_bottom_scroll = getTime();
                    bottom_scroll_count = 0;
                }, Math.max(time, 2000));
            }
            fixFormPosition();
            return;
        } else {
            this.last_reload_time = cur;
        }

        //reloading_start_time = performance.now();   // リロード全体時間計測用
        this.loading = true;
        this.notify.setText(`レス取得中……`);
        changeBgColor();
        let xhr = new XMLHttpRequest();
        xhr.timeout = time_out;
        if (this.last_etag) {
            xhr.responseType = "document";
            xhr.addEventListener("load", () => { this.onBodyLoad(xhr); });
            xhr.open("GET", location.href);
        } else {
            xhr.addEventListener("load", () => { this.onHeadLoad(xhr); });
            xhr.open("HEAD", location.href + "?" + Math.random());
        }
        xhr.addEventListener("error", () => { this.onError(); });
        xhr.addEventListener("timeout", () => { this.onTimeout(); });
        xhr.send();
        this.notify.moveTo();
    }

    onHeadLoad(header) {
        try {
            if (header.status == 404) {
                this.notify.setAlarmText(`スレは落ちています CODE:404`);
                this.loading = false;
                this.thread_not_found = true;
                dispLogLink();
                fixFormPosition();
                resetBgColor();
                last_bottom_scroll = getTime();
                bottom_scroll_count = 0;
                document.dispatchEvent(new CustomEvent("KOSHIAN_reload_notfound"));
                return;
            }

            if (header.status != 200) {
                this.notify.setText(`レス取得失敗 CODE:${header.status}`);
                this.loading = false;
                fixFormPosition();
                resetBgColor();
                last_bottom_scroll = getTime();
                bottom_scroll_count = 0;
                return;
            }

            let last_mod_header = header.getResponseHeader("last-modified");
            if (last_mod_header) {
                if (!this.last_mod) {
                    this.last_mod = Date.parse(document.lastModified);
                }
                let new_mod = Date.parse(last_mod_header);

                if (this.last_mod == new_mod) {
                    this.notify.setText(`新しいレスはありません`);
                    this.loading = false;
                    fixFormPosition();
                    resetBgColor();
                    last_bottom_scroll = getTime();
                    bottom_scroll_count = 0;
                    return;
                }
                this.new_mod = new_mod;
            } else {
                this.new_mod = null;
            }

            let xhr = new XMLHttpRequest();
            xhr.responseType = "document";
            xhr.timeout = time_out;
            xhr.addEventListener("load", () => { this.onBodyLoad(xhr); });
            xhr.addEventListener("error", () => { this.onError(); });
            xhr.addEventListener("timeout", () => { this.onTimeout(); });
            xhr.open("GET", location.href);
            xhr.send();
        } catch (e) {
            this.loading = false;
            this.notify.setText(`レス取得中失敗`);
            fixFormPosition();
            resetBgColor();
            last_bottom_scroll = getTime();
            bottom_scroll_count = 0;
            console.error("KOSHIAN_reload/res.js/Reloader.onHeadLoad - " + e.name + ": " + e.message);
            console.dir(e);
        }
    }

    onBodyLoad(xhr){
        try{
            let new_etag = null;
            switch(xhr.status){
                case 200:
                    new_etag = xhr.getResponseHeader("ETag");
                    //console.log("KOSHIAN_reload/res.js - Reload.last_etag: " + this.last_etag);
                    //console.log("KOSHIAN_reload/res.js - new_etag: " + new_etag);
                    if (new_etag) {
                        if (this.last_etag == new_etag) {
                            this.notify.setText(`新しいレスはありません`);
                            this.loading = false;
                            fixFormPosition();
                            resetBgColor();
                            last_bottom_scroll = getTime();
                            bottom_scroll_count = 0;
                            return;
                        }
                        this.new_etag = new_etag;
                    } else {
                        this.new_etag = null;
                    }
                    this.addNewResponses(xhr.responseXML);
                    break;
                case 404:
                    this.notify.setAlarmText(`スレは落ちています CODE:404`);
                    this.thread_not_found = true;
                    dispLogLink();
                    document.dispatchEvent(new CustomEvent("KOSHIAN_reload_notfound"));
                    break;
                default:
                    this.notify.setText(`レス取得失敗`);
            }
        }catch(e){
            this.notify.setText(`レス取得失敗 CODE:${xhr.status}`);
            console.error("KOSHIAN_reload/res.js/Reloader.onBodyLoad - " + e.name + ": " + e.message);
            console.dir(e);
        }

        this.loading = false;
        fixFormPosition();
        resetBgColor();
        last_bottom_scroll = getTime();
        bottom_scroll_count = 0;
    }

    addNewResponses(new_document){
        //console.log("KOSHIAN_reload/res.js - response loading time: " + (performance.now() - reloading_start_time).toFixed(2) + "ms");
        //let parsing_start_time = performance.now(); // スレ解析時間計測用

        if(!new_document){
            this.notify.setText(`スレが空です`);
            return;
        }

        let thre = document.getElementsByClassName("thre")[0];
        let new_thre = new_document.getElementsByClassName("thre")[0];
        if(!thre || !new_thre){
            this.notify.setText(`スレがありません`);
            return;
        }

        let tables = thre.getElementsByTagName("table");
        let new_tables = new_thre.getElementsByTagName("table");
        let res_num = tables ? tables.length : 0;
        let new_res_num = new_tables ? new_tables.length : 0;

        let contdisp = document.getElementById("contdisp");
        if (contdisp) {
            let new_cntd = new_thre.getElementsByClassName("cntd")[0];
            if (new_cntd) {
                // 新表示
                // スレ消滅時間
                let expire_time = new_cntd.textContent.match(/.+頃消えます/);
                if (expire_time) {
                    let cntd = document.getElementsByClassName("cntd")[0]; 
                    if (cntd) {
                        cntd.textContent = expire_time[0];
                    }
                    contdisp.textContent = expire_time[0];
                }
                // スレ消滅予告
                for (let elm = new_cntd.nextElementSibling; elm; elm = elm.nextElementSibling) {
                    if (elm.textContent == "このスレは古いので、もうすぐ消えます。") {
                        contdisp.style.color = "red";
                        contdisp.style.fontWeight = "bold";
                        break;
                    }
                }
            } else {
                // 旧表示
                // スレ消滅時間
                let new_smalls = new_thre.getElementsByTagName("small");
                for (let new_small of new_smalls) {
                    let expire_time = new_small.textContent.match(/.+頃消えます/);
                    if (expire_time) {
                        if (contdisp) {
                            contdisp.textContent = expire_time[0];
                        }
                        break;
                    }
                }
                // スレ消滅予告
                let new_fonts = new_thre.getElementsByTagName("font");
                for (let new_font of new_fonts) {
                    if (new_font.textContent == "このスレは古いので、もうすぐ消えます。") {
                        contdisp.style.color = "red";
                        contdisp.style.fontWeight = "bold";
                        break;
                    }
                }
            }
        }

        // レス上限表示更新
        let new_maxres = new_thre.getElementsByClassName("maxres")[0];
        if (new_maxres && new_maxres.textContent) {
            let maxreses = document.getElementsByClassName("maxres");
            for (let maxres of maxreses) {
                maxres.innerHTML = "";
                maxres.appendChild(document.createTextNode(new_maxres.textContent));
                maxres.appendChild(document.createElement("br"));
            }
        }

        // 削除されたレスの表示設定を取得
        let ddbut = document.getElementById("ddbut");
        let is_ddbut_shown = ddbut ? ddbut.textContent == "隠す" : false;

        if (refresh_deleted_res) {
            //let deleted_res_refreshing_start_time = performance.now();    // 処理時間測定用

            // スレ本文の削除情報を更新
            let new_blockquote = new_thre.getElementsByTagName("blockquote")[0];
            if (new_blockquote) {
                let new_blockquote_text = new_blockquote.textContent;
                for (let no_comment of no_comment_list) {
                    if (no_comment.test(new_blockquote_text)) {
                        let blockquote = thre.getElementsByTagName("blockquote")[0];
                        if (blockquote && blockquote.textContent != new_blockquote_text && !blockquote.style.border) {
                            blockquote.style.border = "2px dashed red";
                            let blockquote_font = document.createElement("font");
                            blockquote_font.style.color = "red";
                            blockquote_font.textContent = new_blockquote.textContent;
                            let blockquote_br = document.createElement("br");
                            blockquote.insertBefore(blockquote_br, blockquote.firstChild);
                            blockquote.insertBefore(blockquote_font, blockquote.firstChild);
                        }
                        break;
                    }
                }
            }

            // スレ画像の削除情報を更新
            let new_img = new_thre.querySelector(".thre > a > img");
            if (!new_img) {
                let img = thre.querySelector(".thre > a > img");
                if (img && !img.style.border) {
                    img.style.border = "2px dashed red";
                }
            }

            if (new_res_num) {
                // 「削除された記事がx件あります」更新
                let new_ddel = new_document.getElementById("ddel");
                if (new_ddel) {
                    let ddnum = document.getElementById("ddnum");
                    if (ddnum) {
                        let new_ddnum = new_document.getElementById("ddnum");
                        if (new_ddnum) {
                            ddnum.textContent = new_ddnum.textContent;
                        }
                    } else {
                        // レスが初めて削除
                        if (res_num) {
                            // レス有り
                            tables[0].parentNode.insertBefore(new_ddel, tables[0]);
                        } else {
                            // 0レス
                            let maxres = thre.getElementsByClassName("maxres")[0];
                            if (maxres) {
                                maxres.parentNode.insertBefore(new_ddel, maxres.nextSibling);
                            }
                        }
                        ddbut = document.getElementById("ddbut");
                        is_ddbut_shown = ddbut ? ddbut.textContent == "隠す" : false;
                        if (show_deleted_res && !ddbut_clicked && ddbut && !is_ddbut_shown) {
                            // 削除されたレスを表示する
                            ddbut.click();
                            ddbut_clicked = true;
                            is_ddbut_shown = true;
                        } 
                    }
                }
            }

            let deleteds = thre.getElementsByClassName("deleted");
            let new_deleteds = new_thre.getElementsByClassName("deleted");
            let deleted_num = deleteds ? deleteds.length : 0;
            let new_deleted_num = new_deleteds ? new_deleteds.length : 0;

            if (deleted_num < new_deleted_num) {
                // 削除レス情報更新
                for (let new_deleted of new_deleteds) {
                    let new_deleted_input = new_deleted.getElementsByTagName("input")[0];
                    if (new_deleted_input) {
                        let deleted_input = document.getElementById(new_deleted_input.id);
                        if (deleted_input) {
                            let deleted_td = deleted_input.parentNode;
                            let deleted_table = deleted_td.parentNode.parentNode.parentNode;
                            if (deleted_table && deleted_table.className != "deleted") {
                                deleted_table.className = "deleted";
                                deleted_td.style.border = "2px dashed red";
                                let new_deleted_blockquote = new_deleted.getElementsByTagName("blockquote")[0];
                                if (new_deleted_blockquote) {
                                    let new_deleted_font = new_deleted_blockquote.getElementsByTagName("font")[0];
                                    if (new_deleted_font) {
                                        let deleted_font = new_deleted_font.cloneNode(true);
                                        let deleted_br = document.createElement("br");
                                        let deleted_blockquote = deleted_td.getElementsByTagName("blockquote")[0];
                                        if (deleted_blockquote) {
                                            deleted_blockquote.insertBefore(deleted_br, deleted_blockquote.firstChild);
                                            deleted_blockquote.insertBefore(deleted_font, deleted_blockquote.firstChild);
                                            deleted_table.style.display = is_ddbut_shown ? "table" : "none";
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            //console.log("KOSHIAN_reload/res.js - deleted res refreshing time: " + (performance.now() - deleted_res_refreshing_start_time).toFixed(2) + "msec");
        }

        if (show_deleted_res && !ddbut_clicked) {
            // 削除されたレスを表示する
            let ddbut = document.getElementById("ddbut");
            if (ddbut && ddbut.textContent == "見る") {
                ddbut.click();
                ddbut_clicked = true;
            }
        } 

        if (refresh_soudane) {
            // そうだね更新
            //let soudane_refreshing_start_time = performance.now();    // 処理時間測定用

            let new_sods = new_thre.getElementsByClassName("sod");
            for (let i = 0, new_sods_num = new_sods.length; i < new_sods_num; ++i) {
                let sod_id = document.getElementById(new_sods[i].id);
                if (sod_id) {
                    let new_sod_text = new_sods[i].textContent;
                    if (new_sod_text != sod_id.textContent) {
                        sod_id.textContent = new_sod_text;
                    }
                }
            }
            //console.log("KOSHIAN_reload/res.js - soudane refreshing time: " + (performance.now() - soudane_refreshing_start_time).toFixed(2) + "msec");
        }

        if (refresh_idip && !is_idip_thread) {    // ID･IPスレはID･IP情報更新不要
            // ID･IP情報更新
            //let idip_refreshing_start_time = performance.now();   // 処理時間測定用

            // スレ
            let new_idip = searchIdIp(new_thre);
            if (new_idip.del_id && new_idip.text) {
                setIdIp(new_idip.del_id, new_idip.text);
            }

            // レス
            let new_rtds = new_thre.getElementsByClassName("rtd");
            for (let i = 0, new_rtds_num = new_rtds.length; i < new_rtds_num; ++i) {
                new_idip = searchIdIp(new_rtds[i]);
                if (new_idip.del_id && new_idip.text) {
                    setIdIp(new_idip.del_id, new_idip.text);
                }
            }
            //console.log("KOSHIAN_reload/res.js - idip refreshing time: " + (performance.now() - idip_refreshing_start_time).toFixed(2) + "msec");
        }

        // スレの最終更新時刻を更新
        this.last_mod = this.new_mod;
        this.last_etag = this.new_etag;

        if(res_num == new_res_num){
            this.notify.setText(`新しいレスはありません`);
            return;
        }
        
        if(new_res_num == 0){
            this.notify.setText(`スレの取得に失敗しました`);
            return;
        }

        // 新着レスを断片に集約
        let fragment = document.createDocumentFragment();
        for (let i = res_num; i < new_res_num; ++i) {
            let inserted = fragment.appendChild(new_tables[res_num]);
            // 削除された新着レスへ削除レス表示設定を反映
            if (inserted.className == "deleted") {
                inserted.style.display = is_ddbut_shown ? "table" : "none";
            }
        }

        // スクロール位置を保存
        let doc_elm = document.documentElement;
        let scroll_top = doc_elm.scrollTop;

        // 新着レスを挿入
        thre.appendChild(fragment);

        // スクロール位置を新着レス挿入前に戻す(Fx66+ スクロールアンカー対策)
        doc_elm.scrollTop = scroll_top;

        this.notify.setText(`新着レス:${new_res_num - res_num}`);

        resetBgColor();

        //console.log("KOSHIAN_reload/res.js/Reloader - reloading time except reload event: " + (performance.now() - reloading_start_time).toFixed(2) + "ms");
        //console.log("KOSHIAN_reload/res.js/Reloader - parsing time except reload event: " + (performance.now() - parsing_start_time).toFixed(2) + "ms");

        document.dispatchEvent(new CustomEvent("KOSHIAN_reload"));

        //console.log("KOSHIAN_reload/res.js/Reloader - reloading time: " + (performance.now() - reloading_start_time).toFixed(2) + "ms");
        //console.log("KOSHIAN_reload/res.js/Reloader - parsing time: " + (performance.now() - parsing_start_time).toFixed(2) + "ms");
    }

    onError() {
        this.loading = false;
        this.notify.setText(`通信失敗`);
        fixFormPosition();
        resetBgColor();
        last_bottom_scroll = getTime();
        bottom_scroll_count = 0;
    }

    onTimeout() {
        this.loading = false;
        this.notify.setText(`接続がタイムアウトしました`);
        fixFormPosition();
        resetBgColor();
        last_bottom_scroll = getTime();
        bottom_scroll_count = 0;
    }
}

function fixFormPosition() {
    let form = document.getElementById("ftbl");
    let uform = document.getElementById("ufm");

    if (!form || !uform) {
        return;
    }

    if (form.style.position != "absolute") {
        return;
    }

    let rect = uform.getBoundingClientRect();
    let top = rect.y + document.documentElement.scrollTop;
    form.style.top = `${top}px`;
}

/**
 * 過去ログへのリンクを表示
 */
function dispLogLink() {
    let href_match = location.href.match(/^https?:\/\/([^/.]+)\.2chan\.net\/([^/]+)\/res\/(\d+)\.htm$/);
    let link_id;

    // 「」ッチー
    link_id = document.getElementById("KOSHIAN_tsumanne_link");
    if (use_tsumanne_link && !link_id && href_match && !tsumanne_loading) {
        let server;
        switch (`${href_match[1]}_${href_match[2]}`) {
            case "may_b":
                server = "my";
                break;
            case "img_b":
                server = "si";
                break;
            case "dat_b":
                server = "sa";
                break;
            default:
                server = "";
        }
        if (server) {
            let xhr = new XMLHttpRequest();
            xhr.responseType = "json";
            xhr.timeout = time_out;
            xhr.addEventListener("load", () => {
                if (xhr.status == 200) {
                    let res = xhr.response;
                    if (res.success) {
                        let link = `${location.protocol}//tsumanne.net${res.path}`;
                        setLogLink(link, "tsumanne");
                    }
                }
            });
            xhr.addEventListener("error", () => {
                tsumanne_loading = false;
            });
            xhr.addEventListener("timeout", () => {
                tsumanne_loading = false;
            });
            xhr.open("GET", `${location.protocol}//tsumanne.net/${server}/indexes.php?format=json&sbmt=URL&w=${href_match[3]}`);
            xhr.send();
            tsumanne_loading = true;
        }
    }

    // FTBucket
    link_id = document.getElementById("KOSHIAN_ftbucket_link");
    if (use_ftbucket_link && !link_id && href_match && !ftbucket_loading
        && `${href_match[1]}_${href_match[2]}`.match(/may_b|img_b|jun_jun|dec_55|dec_60/)) {
        let board = `${href_match[1]}_${href_match[2]}` == "jun_jun" ? "b" : href_match[2];  // jun_junはjun_bに変換
        let link = `${location.protocol}//www.ftbucket.info/scrapshot/ftb/cont/${href_match[1]}.2chan.net_${board}_res_${href_match[3]}/index.htm`;
        let xhr = new XMLHttpRequest();
        xhr.timeout = time_out;
        xhr.addEventListener("load", () => {
            if (xhr.status == 200) {
                setLogLink(link, "ftbucket");
            }
        });
        xhr.addEventListener("error", () => {
            ftbucket_loading = false;
        });
        xhr.addEventListener("timeout", () => {
            ftbucket_loading = false;
        });
        xhr.open("HEAD", link);
        xhr.send();
        ftbucket_loading = true;
    }

    // ふたポ
    link_id = document.getElementById("KOSHIAN_futapo_link");
    if (use_futapo_link && !link_id && href_match
        && `${href_match[1]}_${href_match[2]}`.match(/may_b|img_b/)) {
        let link = `${location.protocol}//kako.futakuro.com/futa/${href_match[1]}_${href_match[2]}/${href_match[3]}/`;
        setLogLink(link, "futapo");
    }

    /**
     * 過去ログへのリンクを設定
     * @param {string} link 過去ログのアドレス
     * @param {string} name リンクに表示されるテキスト
     */
    function setLogLink(link, name) {
        let span = document.createElement("span");
        span.textContent = " [";
        let a = document.createElement("a");
        a.id = "KOSHIAN_" + name + "_link";
        a.href = link;
        a.target = "_blank";
        a.textContent = name;
        span.appendChild(a);
        let txt = document.createTextNode("]");
        span.appendChild(txt);
        let koshian_notify = document.getElementById("KOSHIAN_NOTIFY");
        if (koshian_notify) {
            koshian_notify.parentNode.insertBefore(span, koshian_notify.nextSibling);
        }
    }
}

function checkThreadMail() {
    // メール欄にID・IPスレが設定されているか確認
    // may形式
    let mail = document.querySelector(".thre > font > b > a");
    if (mail && mail.href.match(/^mailto:i[dp]%E8%A1%A8%E7%A4%BA/i)) {
        return true;
    }
    // img形式
    let anchors = document.querySelectorAll(".thre > a");
    for (let anchor of anchors) {
        if (anchor.href && anchor.href.match(/^mailto:i[dp]%E8%A1%A8%E7%A4%BA/i)) {
            return true;
        }
    }
    // 「KOSHIAN メール欄を表示」対応
    mail = document.getElementsByClassName("KOSHIAN_meran")[0];
    if (mail && mail.textContent.match(/^\[i[dp]表示/i)) {
        return true;
    }
    return false;
}

/**
 * レス内のID・IPを探索
 * @param  {Element} elm ID･IPを探索するレスの要素(.threまたは.rtd)
 * @param  {boolean} ip IPを探索するか
 * @return {Object.<string>} {del_id: del_id, text: text} 探索結果のオブジェクト
 *     {string} del_id レス内のdelチェックボックスのid名
 *     {string} text 検出したID･IP
 */
function searchIdIp(elm, ip = false) {
    let del_id = null;
    let regex = /ID:\S{8}/;
    if (ip) {
        regex = /ID:\S{8}|IP:[^\s[]+/;
    }

    for (let node = elm.firstElementChild; node; node = node.nextSibling) {
        if (node.nodeValue) {
            let idip_text = node.nodeValue.match(regex);
            if (idip_text) {
                return {del_id: del_id, text: idip_text[0]};
            }
        } else if (node.tagName == "INPUT" && node.value == "delete") {
            del_id = node.id;
        } else if (node.className == "del") {
            return {del_id: null, text: null};
        }
    }
    return {del_id: null, text: null};
}

/**
 * 既存レスへID・IPを設定
 * @param {string} new_del_id 既存レス内のdelチェックボックスのid名
 * @param {string} new_idip   設定するID･IP文字列
 */
function setIdIp(new_del_id, new_idip) {
    if (!new_del_id || !new_idip) {
        return;
    }

    let del_elm = document.getElementById(new_del_id);
    if (!del_elm || del_elm.classList.contains("KOSHIAN_reload_idip")) {
        return;
    }

    let time_node = null, time_match = null;
    for (let node = del_elm.nextSibling; node; node = node.nextSibling) {
        if (node.nodeValue) {
            if (!time_node) {
                time_match = node.nodeValue.match(/^( ?\d{2}\/\d{2}\/\d{2}\([^)]+\)\d{2}:\d{2}:\d{2})(.*)/);
                if (time_match) {
                    // 時刻表示のテキストノード
                    time_node = node;
                }
            }
            if (time_node && node.nodeValue.indexOf(new_idip) > -1) {
                del_elm.classList.add("KOSHIAN_reload_idip");
                return;
            }
        } else if (node.name == new_idip && node.tagName == "A") {
            // futaba ID+IP popup
            del_elm.classList.add("KOSHIAN_reload_idip");
            return;
        } else if (node.className == "del") {
            // delボタンで探索終了
            if (time_node) {
                // 時刻表示のテキストノードがあればID・IPを付与する
                time_node.nodeValue = time_match[1] + " " + new_idip + time_match[2];
                del_elm.classList.add("KOSHIAN_reload_idip");
            }
            return;
        }
    }
}

function getTime() {
    return new Date().getTime();
}

let bottom_scroll_count = 0;
let last_bottom_scroll = getTime();

function isBottom(dy) {
    //console.log("KOSHIAN_reload/res.js scrollHeight: " + document.documentElement.scrollHeight);
    //console.log("KOSHIAN_reload/res.js scrollTop + clientHeight: " + (document.documentElement.scrollTop + document.documentElement.clientHeight));
    return (document.documentElement.scrollHeight - (document.documentElement.scrollTop + document.documentElement.clientHeight) <= 1) && (dy > 0);
}

function main() {
    //console.log("KOSHIAN_reload/res.js - is_idip_thread: " + is_idip_thread);

    let reloader = new Reloader();

    if (show_deleted_res && !ddbut_clicked) {
        // 削除されたレスを表示する
        let ddbut = document.getElementById("ddbut");
        if (ddbut && ddbut.textContent == "見る") {
            ddbut.click();
            ddbut_clicked = true;
        }
    }

    let contdisp = document.getElementById("contdisp");
    if (contdisp && contdisp.style.color == "rgb(255, 0, 0)") {
        contdisp.style.fontWeight = "bold";
    }

    document.addEventListener("wheel", (e) => {
        let cur = getTime();

        if (isBottom(e.deltaY)) {
            if (cur - last_bottom_scroll < scroll_period && !reloader.loading && !timer_notify) {
                ++bottom_scroll_count;
                if (bottom_scroll_count > count_to_reload) {
                    bottom_scroll_count = 0;
                    reloader.reload();
                }
            } else {
                last_bottom_scroll = cur;
                bottom_scroll_count = 0;
            }
        } else {
            bottom_scroll_count = 0;
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key == "F5" && !e.ctrlKey && replace_f5_key) {
            e.preventDefault();
            reloader.reload(true);
        }
    });

    if (replace_reload_button) {
        let reload_button = document.getElementById("contres").getElementsByTagName("a")[0];
        if (reload_button) {
            reload_button.onclick = (e) => {    // eslint-disable-line no-unused-vars
                reloader.reload(true);
                return false;
            };
        }
    }

    document.addEventListener("KOSHIAN_form_submit", () => {
        reloader.form_submit = true;
        timer_submit = setTimeout(() => {
            reloader.form_submit = false;
            timer_submit = null;
        }, time_out);
    });

    document.addEventListener("KOSHIAN_form_loaded", () => {
        reloader.form_submit = false;
        if (timer_submit) {
            clearTimeout(timer_submit);
            timer_submit = null;
        }
    });

    fixFormPosition();
}

function changeBgColor() {
    if (change_bg_color) {
        document.body.style.backgroundColor = "#EEEEEE";
    }
}

function resetBgColor() {
    document.body.style.backgroundColor = "";
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

browser.storage.local.get().then((result) => {
    scroll_period = safeGetValue(result.scroll_period, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(result.count_to_reload, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(result.reload_period, DEFAULT_RELOAD_PERIOD);
    replace_f5_key = safeGetValue(result.replace_f5_key, DEFAULT_REPLACE_F5_KEY);
    change_bg_color = safeGetValue(result.change_bg_color, DEFAULT_CHANGE_BG_COLOR);
    show_deleted_res = safeGetValue(result.show_deleted_res, DEFAULT_SHOW_DELETED_RES);
    refresh_deleted_res = safeGetValue(result.refresh_deleted_res, DEFAULT_REFRESH_DELETED_RES);
    refresh_soudane = safeGetValue(result.refresh_soudane, DEFAULT_REFRESH_SOUDANE);
    refresh_idip = safeGetValue(result.refresh_idip, DEFAULT_REFRESH_IDIP);
    use_futapo_link = safeGetValue(result.use_futapo_link, DEFAULT_USE_FUTAPO_LINK);
    use_ftbucket_link = safeGetValue(result.use_ftbucket_link, DEFAULT_USE_FTBUCKET_LINK);
    use_tsumanne_link = safeGetValue(result.use_tsumanne_link, DEFAULT_USE_TSUMANNE_LINK);

    main();
}, (error) => { }); // eslint-disable-line no-unused-vars

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName != "local") {
        return;
    }

    scroll_period = safeGetValue(changes.scroll_period.newValue, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(changes.count_to_reload.newValue, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(changes.reload_period.newValue, DEFAULT_RELOAD_PERIOD);
    replace_f5_key = safeGetValue(changes.replace_f5_key.newValue, DEFAULT_REPLACE_F5_KEY);
    change_bg_color = safeGetValue(changes.change_bg_color.newValue, DEFAULT_CHANGE_BG_COLOR);
    show_deleted_res = safeGetValue(changes.show_deleted_res.newValue, DEFAULT_SHOW_DELETED_RES);
    refresh_deleted_res = safeGetValue(changes.refresh_deleted_res.newValue, DEFAULT_REFRESH_DELETED_RES);
    refresh_soudane = safeGetValue(changes.refresh_soudane.newValue, DEFAULT_REFRESH_SOUDANE);
    refresh_idip = safeGetValue(changes.refresh_idip.newValue, DEFAULT_REFRESH_IDIP);
    use_futapo_link = safeGetValue(changes.use_futapo_link.newValue, DEFAULT_USE_FUTAPO_LINK);
    use_ftbucket_link = safeGetValue(changes.use_ftbucket_link.newValue, DEFAULT_USE_FTBUCKET_LINK);
    use_tsumanne_link = safeGetValue(changes.use_tsumanne_link.newValue, DEFAULT_USE_TSUMANNE_LINK);

    if (show_deleted_res && !ddbut_clicked) {
        let ddbut = document.getElementById("ddbut");
        if (ddbut && ddbut.textContent == "見る") {
            // 削除されたレスを表示する
            ddbut.click();
            ddbut_clicked = true;
        }
    }

});