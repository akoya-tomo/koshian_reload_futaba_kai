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
const DEFAULT_REFRESH_DELETED_RES = false;
const DEFAULT_REFRESH_SOUDANE = false;
const DEFAULT_REFRESH_IDIP = false;
const DEFAULT_USE_FUTAPO_LINK = false;
const DEFAULT_USE_FTBUCKET_LINK = false;
const DEFAULT_USE_TSUMANNE_LINK = false;
let scroll_period = DEFAULT_SCROLL_PERIOD;
let count_to_reload = DEFAULT_COUNT_TO_RELOAD;
let reload_period = DEFAULT_RELOAD_PERIOD;
let time_out = DEFAULT_TIME_OUT;
let replace_reload_button = DEFAULT_REPLACE_RELOAD_BUTTON;
let replace_f5_key = DEFAULT_REPLACE_F5_KEY;
let refresh_deleted_res = DEFAULT_REFRESH_DELETED_RES;
let refresh_soudane = DEFAULT_REFRESH_SOUDANE;
let refresh_idip = DEFAULT_REFRESH_IDIP;
let use_futapo_link = DEFAULT_USE_FUTAPO_LINK;
let use_ftbucket_link = DEFAULT_USE_FTBUCKET_LINK;
let use_tsumanne_link = DEFAULT_USE_TSUMANNE_LINK;
let isIdIpThread = checkThreadMail();
let tsumanne_loading = false;
let ftbucket_loading = false;

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

            this.moveTo(10000);
        }
    }

    setText(text) {
        this.text.textContent = text;
        this.notify.style.color = "";
        this.notify.style.fontWeight = "";
    }

    setAlarmText(text) {
        this.text.textContent = text;
        this.notify.style.color = "red";
        this.notify.style.fontWeight = "bold";
    }

    moveTo(index) {
        let tables = this.thre.getElementsByTagName("table");

        if (tables.length == 0 || index == -1) { // 0レス
            let blockquotes = this.thre.getElementsByTagName("blockquote");
            this.thre.insertBefore(this.notify, blockquotes[0].nextElementSibling);
        } else {
            index = Math.min(index, tables.length - 1);
            this.thre.insertBefore(this.notify, tables[index].nextElementSibling);
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
        this.org_mod = null;
        this.new_mod = null;
        this.thread_not_found = false;
        this.form_submit = false;
        this.timer = null;
    }

    reload(force = false) {
        if (this.loading || this.form_submit) {
            return;
        }

        let cur = getTime();

        if (!force && cur - this.last_reload_time < reload_period) {
            if (!this.thread_not_found) this.notify.setText(`ホイールリロード規制中（あと${reload_period - cur + this.last_reload_time}msec）`);  //スレ消滅メッセージ表示を優先
            fixFormPosition();
            return;
        } else {
            this.last_reload_time = cur;
        }

        this.loading = true;
        let xhr = new XMLHttpRequest();
        xhr.timeout = time_out;
        xhr.addEventListener("load", () => { this.onHeadLoad(xhr); });
        xhr.addEventListener("error", () => { this.onError(); });
        xhr.addEventListener("timeout", () => { this.onTimeout(); });
        xhr.open("HEAD", location.href);
        xhr.send();
        this.notify.moveTo(10000);
        this.notify.setText(`レス取得中……`);
    }

    onHeadLoad(header) {
        try {
            if (header.status == 404) {
                this.notify.setAlarmText(`スレは落ちています CODE:404`);
                this.loading = false;
                this.thread_not_found = true;
                dispLogLink();
                fixFormPosition();
                document.dispatchEvent(new CustomEvent("KOSHIAN_reload_notfound"));
                return;
            }

            if (header.status != 200) {
                this.notify.setText(`レス取得失敗 CODE:${header.status}`);
                this.loading = false;
                fixFormPosition();
                return;
            }

            let last_mod_header = header.getResponseHeader("last-modified");
            if (last_mod_header) {
                let org_mod = Date.parse(document.lastModified);
                let new_mod = Date.parse(last_mod_header);

                if (org_mod == new_mod || this.org_mod == new_mod) {
                    this.notify.setText(`新しいレスはありません`);
                    this.loading = false;
                    fixFormPosition();
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
        }        
    }

    onBodyLoad(xhr){
        try{
            switch(xhr.status){
              case 200:  // eslint-disable-line indent
                this.addNewResponses(xhr.responseXML);
                break;
              case 404:  // eslint-disable-line indent
                this.notify.setAlarmText(`スレは落ちています CODE:404`);
                this.thread_not_found = true;
                document.dispatchEvent(new CustomEvent("KOSHIAN_reload_notfound"));
                break;
              default:  // eslint-disable-line indent
                this.notify.setText(`レス取得失敗`);
            }
        }catch(e){
            this.notify.setText(`レス取得失敗 CODE:${xhr.status}`);
            console.error("KOSHIAN_reload/res.js - onBodyLoad error: " + e);  // eslint-disable-line no-console
        }

        this.loading = false;
        fixFormPosition();
    }

    addNewResponses(new_document){
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
            // スレ消滅時間
            let new_cntds = new_thre.getElementsByClassName("cntd");   // 新式表示
            let expire_time = null;
            for (let new_cntd of new_cntds) {
                expire_time = new_cntd.textContent.match(/.+頃消えます/);
                if (expire_time) {
                    contdisp.textContent = expire_time[0];
                    break;
                }
            }
            if (!expire_time) {
                let new_smalls = new_thre.getElementsByTagName("small");    //旧式表示
                for (let new_small of new_smalls) {
                    expire_time = new_small.textContent.match(/.+頃消えます/);
                    if (expire_time) {
                        contdisp.textContent = expire_time[0];
                        break;
                    }
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

        if (refresh_deleted_res) {
            //let refresh_deleted_res_start_time = Date.now();  //処理時間計測用

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
                let new_ddel = new_tables[0].previousElementSibling;
                if (new_ddel && new_ddel.id == "ddel") {
                    let ddel = document.getElementById("ddel");
                    if (ddel) {
                        let new_ddnum = new_ddel.firstElementChild;
                        if (new_ddnum && new_ddnum.id == "ddnum") {
                            let ddnum = document.getElementById("ddnum");
                            if (ddnum) {
                                ddnum.textContent = new_ddnum.textContent;
                            }
                        }
                    } else if (res_num) {
                        tables[0].parentNode.insertBefore(new_ddel, tables[0]);
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
                    if (!new_deleted_input) break;
                    let deleted_input = document.getElementById(new_deleted_input.id);
                    if (deleted_input) {
                        let deleted_table = deleted_input.parentNode.parentNode.parentNode.parentNode;
                        let deleted_td = deleted_input.parentNode;
                        if (deleted_table && !deleted_table.classList.contains("deleted")) {
                            deleted_table.classList.add("deleted");
                            deleted_td.style.border = "2px dashed red";
                            let new_deleted_blockquote = new_deleted.getElementsByTagName("blockquote")[0];
                            if (new_deleted_blockquote) {
                                let new_deleted_font = new_deleted_blockquote.getElementsByTagName("font")[0];
                                if (new_deleted_font) {
                                    let deleted_font = new_deleted_font.cloneNode(true);
                                    let deleted_br = document.createElement("br");
                                    let deleted_blockquote = deleted_table.getElementsByTagName("blockquote")[0];
                                    if (deleted_blockquote) {
                                        deleted_blockquote.insertBefore(deleted_br, deleted_blockquote.firstChild);
                                        deleted_blockquote.insertBefore(deleted_font, deleted_blockquote.firstChild);
                                        deleted_table.style.display = "table";
                                    }
                                }
                            }
                        }
                    }
                }
            }

            //console.log("res.js refresh deleted res processing time: " + (Date.now() - refresh_deleted_res_start_time) + "msec");
        }

        if (refresh_soudane) {
            // そうだね更新
            //let refresh_soudane_start_time = Date.now();  //処理時間計測用
            let new_sods = new_thre.getElementsByClassName("sod");
            for (let new_sod of new_sods) {
                let sod_id = document.getElementById(new_sod.id);
                if (sod_id) sod_id.textContent = new_sod.textContent;
            }
            //console.log("res.js refresh soudane processing time: " + (Date.now() - refresh_soudane_start_time) + "msec");
        }

        if (!isIdIpThread && refresh_idip) {    // ID･IPスレはID･IP情報更新不要
            // ID･IP情報更新
            //let refresh_idip_start_time = Date.now(); //処理時間計測用

            // スレ
            let [new_del_id, new_idip_text] = searchIdIp(new_thre);
            if (new_del_id && new_idip_text) {
                setIdIp(new_del_id, new_idip_text);
            }

            // レス
            let new_rtds = new_thre.getElementsByClassName("rtd");
            for (let new_rtd of new_rtds) {
                [new_del_id, new_idip_text] = searchIdIp(new_rtd);
                if (new_del_id && new_idip_text) setIdIp(new_del_id, new_idip_text);
            }
            //console.log("res.js refresh idip processing time: " + (Date.now() - refresh_idip_start_time) + "msec");
        }

        if(res_num == new_res_num){
            this.notify.setText(`新しいレスはありません`);
            return;
        }
        
        if(new_res_num == 0){
            this.notify.setText(`スレの取得に失敗しました`);
            return;
        }

        // 削除されたレスの表示設定を取得
        let ddbut = document.getElementById("ddbut");
        let show_deleted_res = ddbut ? ddbut.textContent == "隠す" : false;

        // スクロール位置を保存
        let scroll_top = document.documentElement.scrollTop;

        // 新着レスを挿入
        for (let i = res_num, inserted = res_num == 0 ? thre.getElementsByTagName("blockquote")[0] : tables[res_num - 1]; i < new_res_num; ++i) {
            inserted = thre.insertBefore(new_tables[res_num], inserted.nextElementSibling);
            // 削除された新着レスへ削除レス表示設定を反映
            if (inserted.classList.contains("deleted")) {
                inserted.style.display = show_deleted_res ? "table" : "none";
            }
        }

        // スクロール位置を新着レス挿入前に戻す(Fx66+対策)
        document.documentElement.scrollTop = scroll_top;

        this.notify.setText(`新着レス:${new_res_num - res_num}`);
        this.notify.moveTo(res_num - 1);

        document.dispatchEvent(new CustomEvent("KOSHIAN_reload"));

        // スレの最終更新時刻を更新
        if (this.new_mod) {
            this.org_mod = this.new_mod;
        }
    }

    onError() {
        this.loading = false;
        this.notify.setText(`通信失敗`);
        fixFormPosition();
    }

    onTimeout() {
        this.loading = false;
        this.notify.setText(`接続がタイムアウトしました`);
        fixFormPosition();
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
                        let link = `http://tsumanne.net${res.path}`;
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
            xhr.open("GET", `http://tsumanne.net/${server}/indexes.php?format=json&sbmt=URL&w=${href_match[3]}`);
            xhr.send();
            tsumanne_loading = true;
        }
    }

    // FTBucket
    link_id = document.getElementById("KOSHIAN_ftbucket_link");
    if (use_ftbucket_link && !link_id && href_match && !ftbucket_loading
        && `${href_match[1]}_${href_match[2]}`.match(/may_b|img_b|jun_jun|dec_55|dec_60/)) {
        let board = `${href_match[1]}_${href_match[2]}` == "jun_jun" ? "b" : href_match[2];  // jun_junはjun_bに変換
        let link = `http://www.ftbucket.info/scrapshot/ftb/cont/${href_match[1]}.2chan.net_${board}_res_${href_match[3]}/index.htm`;
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
        let link = `http://kako.futakuro.com/futa/${href_match[1]}_${href_match[2]}/${href_match[3]}/`;
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
    let mail = document.querySelector("html > body > form > div > font > b > a");
    if (mail && mail.href.match(/^mailto:i[dp]%E8%A1%A8%E7%A4%BA/i)) {
        return true;
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
 * @return {Array.<string>} [del_id, idip_text]
 *     {string} del_id    レス内のdelチェックボックスのid名
 *     {string} idip_text 検出したID･IP
 */
function searchIdIp(elm) {
    let del_id;
    for (let i = 0; i < elm.childNodes.length; i++) {
        let node = elm.childNodes[i];
        if (node.tagName == "BLOCKQUOTE") return [null, null];
        if (node.tagName == "INPUT") {
            del_id = node.id;
        }
        if (node.nodeValue) {
            let idip_text = node.nodeValue.match(/I[DP]:\S{8}/);
            if (idip_text) {
                if (del_id) {
                    return [del_id, idip_text];
                } else {
                    return [null, null];
                }
            }
        }
    }
    return [null, null];
}

/**
 * 既存レスへID・IPを設定
 * @param {string} new_del_id 既存レス内のdelチェックボックスのid名
 * @param {string} new_idip   設定するID･IP文字列
 */
function setIdIp(new_del_id, new_idip) {
    if (!new_del_id || !new_idip) return;
    let del_elm = document.getElementById(new_del_id);
    if (!del_elm || del_elm.classList.contains("KOSHIAN_reload_idip")) return;
    let parent = del_elm.parentNode;
    let time_node = null, time_text;
    for (let i = 0; i < parent.childNodes.length; i++) {
        let node = parent.childNodes[i];
        if (node.tagName == "BLOCKQUOTE") {
            if (time_node) {
                time_node.nodeValue = time_text[1] + " " + new_idip + time_text[2];
                del_elm.classList.add("KOSHIAN_reload_idip");
            }
            return;
        } else if (node.tagName == "A") {
            if (node.name == new_idip) {
                del_elm.classList.add("KOSHIAN_reload_idip");
                return;
            }
        } else if (node.nodeValue) {
            if (!time_node) {
                let time_match = node.nodeValue.match(/^( ?\d{2}\/\d{2}\/\d{2}\([^)]+\)\d{2}:\d{2}:\d{2})(.*)/);
                if (time_match) {
                    time_node = node;
                    time_text = time_match;
                }
            }
            if (time_node) {
                if (node.nodeValue.indexOf(new_idip) > -1) {
                    del_elm.classList.add("KOSHIAN_reload_idip");
                    return;
                }
            }
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
    //console.log("res.js isIdIpThread: " + isIdIpThread);

    let reloader = new Reloader();

    document.addEventListener("wheel", (e) => {
        let cur = getTime();

        if (isBottom(e.deltaY)) {
            if (cur - last_bottom_scroll < scroll_period) {
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
        if (e.key == "F5" && replace_f5_key) {
            e.preventDefault();
            reloader.reload(true);
        }
    });

    if (replace_reload_button) {
        let reload_button = document.getElementById("contres").getElementsByTagName("a")[0];
        if (reload_button) {
            reload_button.onclick = (e) => {
                reloader.reload(true);
                return false;
            };
        }
    }

    document.addEventListener("KOSHIAN_form_submit", () => {
        reloader.form_submit = true;
        reloader.timer = setTimeout(() => {
            reloader.form_submit = false;
            reloader.timer = null;
        }, time_out);
    });

    document.addEventListener("KOSHIAN_form_loaded", () => {
        reloader.form_submit = false;
        if (reloader.timer) {
            clearTimeout(reloader.timer);
            reloader.timer = null;
        }
    });

    fixFormPosition();
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

browser.storage.local.get().then((result) => {
    scroll_period = safeGetValue(result.scroll_period, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(result.count_to_reload, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(result.reload_period, DEFAULT_RELOAD_PERIOD);
    replace_reload_button = safeGetValue(result.replace_reload_button, DEFAULT_REPLACE_RELOAD_BUTTON);
    replace_f5_key = safeGetValue(result.replace_f5_key, DEFAULT_REPLACE_F5_KEY);
    refresh_deleted_res = safeGetValue(result.refresh_deleted_res, DEFAULT_REFRESH_DELETED_RES);
    refresh_soudane = safeGetValue(result.refresh_soudane, DEFAULT_REFRESH_SOUDANE);
    refresh_idip = safeGetValue(result.refresh_idip, DEFAULT_REFRESH_IDIP);
    use_futapo_link = safeGetValue(result.use_futapo_link, DEFAULT_USE_FUTAPO_LINK);
    use_ftbucket_link = safeGetValue(result.use_ftbucket_link, DEFAULT_USE_FTBUCKET_LINK);
    use_tsumanne_link = safeGetValue(result.use_tsumanne_link, DEFAULT_USE_TSUMANNE_LINK);

    main();
}, (error) => { });

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName != "local") {
        return;
    }

    scroll_period = safeGetValue(changes.scroll_period.newValue, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(changes.count_to_reload.newValue, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(changes.reload_period.newValue, DEFAULT_RELOAD_PERIOD);
    replace_f5_key = safeGetValue(changes.replace_f5_key.newValue, DEFAULT_REPLACE_F5_KEY);
    refresh_deleted_res = safeGetValue(changes.refresh_deleted_res.newValue, DEFAULT_REFRESH_DELETED_RES);
    refresh_soudane = safeGetValue(changes.refresh_soudane.newValue, DEFAULT_REFRESH_SOUDANE);
    refresh_idip = safeGetValue(changes.refresh_idip.newValue, DEFAULT_REFRESH_IDIP);
    use_futapo_link = safeGetValue(changes.use_futapo_link.newValue, DEFAULT_USE_FUTAPO_LINK);
    use_ftbucket_link = safeGetValue(changes.use_ftbucket_link.newValue, DEFAULT_USE_FTBUCKET_LINK);
    use_tsumanne_link = safeGetValue(changes.use_tsumanne_link.newValue, DEFAULT_USE_TSUMANNE_LINK);
});