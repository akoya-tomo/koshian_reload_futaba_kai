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
//const DEFAULT_USE_FUTABACHIN_LINK = false;
const DEFAULT_USE_FUTAPO_LINK = false;
let scroll_period = DEFAULT_SCROLL_PERIOD;
let count_to_reload = DEFAULT_COUNT_TO_RELOAD;
let reload_period = DEFAULT_RELOAD_PERIOD;
let time_out = DEFAULT_TIME_OUT;
let replace_reload_button = DEFAULT_REPLACE_RELOAD_BUTTON;
let replace_f5_key = DEFAULT_REPLACE_F5_KEY;
let refresh_deleted_res = DEFAULT_REFRESH_DELETED_RES;
let refresh_soudane = DEFAULT_REFRESH_SOUDANE;
let refresh_idip = DEFAULT_REFRESH_IDIP;
//let use_futabachin_link = DEFAULT_USE_FUTABACHIN_LINK;
let use_futapo_link = DEFAULT_USE_FUTAPO_LINK;
let isIdIpThread = checkThreadMail();

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
    }

    reload(force = false) {
        if (this.loading) {
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
            xhr.addEventListener("load", () => { this.onBoyLoad(xhr); });
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

    onBoyLoad(xhr){
        try{
            switch(xhr.status){
                case 200:
                    this.addNewResponses(xhr.responseXML);
                    break;
                case 404:
                    this.notify.setAlarmText(`スレは落ちています CODE:404`);
                    this.thread_not_found = true;
                    document.dispatchEvent(new CustomEvent("KOSHIAN_reload_notfound"));
                    break;
                default:
                    this.notify.setText(`レス取得失敗`);
            }
        }catch(e){
            this.notify.setText(`レス取得失敗 CODE:${xhr.status}`);
            console.log("res.js onBodyLoad error:" + e);
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

        let new_smalls = new_thre.getElementsByTagName("small");
        let new_fonts = new_thre.getElementsByTagName("font");
        let contdisp = document.getElementById("contdisp");

        if (contdisp) {
            //スレ消滅時間
            for (let i = 0; i < new_smalls.length; i++) {
                let small_text = new_smalls[i].textContent;
                let expire_time = small_text.match(/.+頃消えます/);
                if (expire_time) {
                    contdisp.textContent = expire_time[0];
                    break;
                }
            }

            //スレ消滅予告
            for (let i = 0; i < new_fonts.length; i++) {
                if (new_fonts[i].textContent == "このスレは古いので、もうすぐ消えます。") {
                    contdisp.style.color = "red";
                    contdisp.style.fontWeight = "bold";
                    break;
                }
            }
        }

        if (refresh_deleted_res) {
            //スレ本文の削除情報を更新
            //let refresh_deleted_res_start_time = Date.now();  //処理時間計測用
            let new_blockquotes = new_thre.getElementsByTagName("blockquote");
            if (new_blockquotes.length) {
                for (let no_comment of no_comment_list) {
                    if (no_comment.test(new_blockquotes[0].textContent)) {
                        let blockquotes = thre.getElementsByTagName("blockquote");
                        if (blockquotes.length &&
                            blockquotes[0].textContent != new_blockquotes[0].textContent &&
                            !blockquotes[0].style.border) {
                            blockquotes[0].style.border = "2px dashed red";
                            let blockquotes_font = document.createElement("font");
                            blockquotes_font.style.color = "red";
                            blockquotes_font.textContent = new_blockquotes[0].textContent;
                            let blockquotes_br = document.createElement("br");
                            blockquotes[0].insertBefore(blockquotes_br, blockquotes[0].firstChild);
                            blockquotes[0].insertBefore(blockquotes_font, blockquotes[0].firstChild);
                        }
                        break;
                    }
                }
            }

            //スレ画像の削除情報を更新
            let new_img = new_thre.querySelector(".thre > a > img");
            if (!new_img) {
                let img = thre.querySelector(".thre > a > img");
                if (img && !img.style.border) {
                    img.style.border = "2px dashed red";
                }
            }

            let deleteds = thre.getElementsByClassName("deleted");
            let new_deleteds = new_thre.getElementsByClassName("deleted");
            let deleted_num = deleteds ? deleteds.length : 0;
            let new_deleted_num = new_deleteds ? new_deleteds.length : 0;
            if (new_res_num) {
                //「削除された記事がx件あります」更新
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

            if (deleted_num < new_deleted_num) {
                //削除レス情報更新
                for (let i = 0; i < new_deleted_num; i++) {
                    let new_deleted_inputs = new_deleteds[i].getElementsByTagName("input");
                    if (!new_deleted_inputs.length) break;
                    let new_deleted_input_id = new_deleted_inputs[0].id;
                    let deleted_input = document.getElementById(new_deleted_input_id);
                    if (deleted_input) {
                        let deleted_table = deleted_input.parentNode.parentNode.parentNode.parentNode;
                        let deleted_td =deleted_input.parentNode;
                        if (deleted_table && !deleted_table.classList.contains("deleted")) {
                            deleted_table.classList.add("deleted");
                            deleted_td.style.border = "2px dashed red";
                            let new_deleted_blockquotes = new_deleteds[i].getElementsByTagName("blockquote");
                            if (new_deleted_blockquotes.length) {
                                let new_deleted_fonts = new_deleted_blockquotes[0].getElementsByTagName("font");
                                if (new_deleted_fonts.length) {
                                    //削除レス本文内の削除理由コメント更新
                                    let new_deleted_text = new_deleted_fonts[0].textContent;
                                    let new_deleted_bolds = new_deleted_fonts[0].getElementsByTagName("b");
                                    let deleted_font = document.createElement("font");
                                    deleted_font.style.color = "red";
                                    if (new_deleted_bolds.length) {
                                        deleted_font.style.fontWeight = "bold";
                                    }
                                    deleted_font.textContent = new_deleted_text;
                                    let deleted_br = document.createElement("br");
                                    let deleted_blockquotes = deleted_table.getElementsByTagName("blockquote");
                                    if (deleted_blockquotes.length) {
                                        deleted_blockquotes[0].insertBefore(deleted_br, deleted_blockquotes[0].firstChild);
                                        deleted_blockquotes[0].insertBefore(deleted_font, deleted_blockquotes[0].firstChild);
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
            //そうだね更新
            let new_sods = new_thre.getElementsByClassName("sod");
            let new_sod_num  = new_sods ? new_sods.length : 0;
            if (new_sod_num) {
                //let refresh_soudane_start_time = Date.now();  //処理時間計測用
                for (let i = 0; i < new_sod_num; i++) {
                    let new_sod_id = new_sods[i].id;
                    let new_sod_text = new_sods[i].textContent;
                    let sod_id = document.getElementById(new_sod_id);
                    if (sod_id) {
                        sod_id.textContent = new_sod_text;
                    }
                }
                //console.log("res.js refresh soudane processing time: " + (Date.now() - refresh_soudane_start_time) + "msec");
            }
        }

        if (!isIdIpThread && refresh_idip) {    //ID・IPスレは更新不要
            //ID･IP情報更新
            //let refresh_idip_start_time = Date.now(); //処理時間計測用
            //スレ
            let [new_del_id, new_idip_text] = searchIdIp(new_thre);
            if (new_del_id && new_idip_text) {
                setIdIp(new_del_id, new_idip_text);
            }

            //レス
            let new_rtds = new_thre.getElementsByClassName("rtd");
            for (let i = 0; i < new_rtds.length; i++) {
                [new_del_id, new_idip_text] = searchIdIp(new_rtds[i]);
                if (new_del_id && new_idip_text) {
                    setIdIp(new_del_id, new_idip_text);
                }
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

        //削除されたレスの表示設定を取得
        let ddbut = document.getElementById("ddbut");
        let show_deleted_res = ddbut ? ddbut.textContent == "隠す" : false;

        for (let i = res_num, inserted = res_num == 0 ? thre.getElementsByTagName("blockquote")[0] : tables[res_num - 1]; i < new_res_num; ++i) {
            inserted = thre.insertBefore(new_tables[res_num], inserted.nextElementSibling);
            //削除された新着レスへ削除レス表示設定を反映
            if (inserted.classList.contains("deleted")) {
                inserted.style.display = show_deleted_res ? "table" : "none";
            }
        }

        this.notify.setText(`新着レス:${new_res_num - res_num}`);
        this.notify.moveTo(res_num - 1);

        document.dispatchEvent(new CustomEvent("KOSHIAN_reload"));

        //スレの最終更新時刻を更新
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

function dispLogLink() {
    //過去ログへのリンクを表示
    let href_match = location.href.match(/^https?:\/\/(may|img)\.2chan\.net\/b\/res\/(\d+)\.htm$/);

    //ふたポ
    let futapo_link_id = document.getElementById("KOSHIAN_futapo_link");
    if (href_match && use_futapo_link && !futapo_link_id) {
        let futapo_link = "http://kako.futakuro.com/futa/" + href_match[1] + "_b/" + href_match[2] + "/";
        setLogLink(futapo_link, "futapo");
    }
    /*
    //ふたば☆ちん（閉鎖）
    let futabachin_link_id = document.getElementById("KOSHIAN_2chin_link");
    if (href_match && use_futabachin_link && !futabachin_link_id) {
        let futabachin_link = href_match[0].replace(".2chan.net/",".2chin.net/");
        setLogLink(futabachin_link, "2chin");
    }
    */
    function setLogLink(link, name) {
        //過去ログへのリンクを設定  link:過去ログのアドレス, name:リンクに表示されるテキスト
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
    //メール欄にID・IPスレが設定されているか確認
    let mail = document.querySelector("html > body > form > div > font > b > a");
    if (mail && mail.href.match(/^mailto:i[dp]%E8%A1%A8%E7%A4%BA/i)) {
        return true;
    }
    //「KOSHIAN メール欄を表示」対応
    mail = document.getElementsByClassName("KOSHIAN_meran")[0];
    if (mail && mail.textContent.match(/^\[i[dp]表示/i)) {
        return true;
    }
    return false;
}

function searchIdIp(elm) {
    //レス内のID・IPを探索 (elm:探索するレスの要素(.thre, .rtd))
    //戻り値: [del_id:レス内のdelチェックボックスのid, idip_text:検出したID･IP文字列]
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

function setIdIp(new_del_id, new_idip) {
    //既存レスへID・IPを設定 (new_del_id:既存レス内のdelチェックボックスのid, new_idip:設定するID･IP文字列)
    if (!new_del_id || !new_idip) return;
    let del_elm = document.getElementById(new_del_id);
    if (!del_elm) return;
    if (del_elm.classList.contains("KOSHIAN_reload_idip")) return;
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
    return;
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
    console.log("res.js isIdIpThread: " + isIdIpThread);

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
            }
        }
    }

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
    //use_futabachin_link = safeGetValue(result.use_futabachin_link, DEFAULT_USE_FUTABACHIN_LINK);
    use_futapo_link = safeGetValue(result.use_futapo_link, DEFAULT_USE_FUTAPO_LINK);

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
    //use_futabachin_link = safeGetValue(changes.use_futabachin_link.newValue, DEFAULT_USE_FUTABACHIN_LINK);
    use_futapo_link = safeGetValue(changes.use_futapo_link.newValue, DEFAULT_USE_FUTAPO_LINK);
});