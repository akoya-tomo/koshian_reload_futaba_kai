const DEFAULT_SCROLL_PERIOD = 500;
const DEFAULT_COUNT_TO_RELOAD = 10;
const DEFAULT_RELOAD_PERIOD = 5000;
const DEFAULT_TIME_OUT = 60000;
const DEFAULT_REPLACE_RELOAD_BUTTON = true;
const DEFAULT_REFRESH_DELETED_RES = false;
const DEFAULT_USE_FUTABACHIN_LINK = false;
let scroll_period = DEFAULT_SCROLL_PERIOD;
let count_to_reload = DEFAULT_COUNT_TO_RELOAD;
let reload_period = DEFAULT_RELOAD_PERIOD;
let time_out = DEFAULT_TIME_OUT;
let replace_reload_button = DEFAULT_REPLACE_RELOAD_BUTTON;
let refresh_deleted_res = DEFAULT_REFRESH_DELETED_RES;
let use_futabachin_link = DEFAULT_USE_FUTABACHIN_LINK;

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
    }

    reload(force = false) {
        if (this.loading) {
            return;
        }

        let cur = getTime();

        if (!force && cur - this.last_reload_time < reload_period) {
            this.notify.setText(`新しいレスはありません`);
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
                this.notify.setText(`スレは落ちています`);
                this.loading = false;
                dispLogLink();
                fixFormPosition();
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

                if (org_mod == new_mod) {
                    this.notify.setText(`新しいレスはありません`);
                    this.loading = false;
                    fixFormPosition();
                    return;
                }
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
                    this.notify.setText(`スレは落ちています`);
                    break;
                default:
                    this.notify.setText(`レス取得失敗`);
            }
        }catch(e){
            this.notify.setText(`レス取得失敗 CODE:${xhr.status}`);
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

        let new_smalls = new_document.getElementsByTagName("small");
        let new_fonts = new_document.getElementsByTagName("font");
        let contdisp = document.getElementById("contdisp");

        if (new_smalls){
          for(let i=0 ; i < new_smalls.length ; i++){
            let small_text = new_smalls[i].innerText;
            if (small_text.length){
//            console.log("res.js : small[" + i + "]_text = " + small_text);
              let limittime = small_text.match(/^.*頃消えます/);
              if (limittime){
                contdisp.innerText = limittime;
//              console.log("res.js : limittime[0] = " + limittime[0]);
                break;
              }
            }
          }
        }

        if(new_fonts){
          for (let i=0 ; i < new_fonts.length ; i++){
            let font_text = new_fonts[i].innerText;
            if (font_text == "このスレは古いので、もうすぐ消えます。"){
//            console.log("res.js : font[" + i + "]_text = " + font_text);
              contdisp.style.color = "red";
              break;
            }
          }
        }

        if (refresh_deleted_res) {
            let deleted = thre.getElementsByClassName("deleted");
            let new_deleted = new_thre.getElementsByClassName("deleted");
            let deleted_num = deleted ? deleted.length : 0;
            let new_deleted_num = new_deleted ? new_deleted.length : 0;
//          console.log("res.js : deleted_num,new_deleted_num = " + deleted_num + "," + new_deleted_num);
            if (deleted_num < new_deleted_num) {
                let show_deleted_res;
                let new_ddel = new_thre.getElementsByTagName("blockquote")[0].nextElementSibling.nextElementSibling;
                if (new_ddel.id == "ddel") {
                    let ddel = document.getElementById("ddel");
                    if (ddel) {
                        let new_ddnum_text = new_ddel.firstElementChild.innerText;
                        let ddnum = document.getElementById("ddnum");
                        ddnum.innerText = new_ddnum_text;
                    } else {
                        let clone_new_ddel = new_ddel.cloneNode(true);
                        let radtop = document.getElementById("radtop");
                        radtop.parentNode.insertBefore(clone_new_ddel, radtop.nextSibling);
                    }
                    let ddbut = document.getElementById("ddbut");
                    show_deleted_res = ddbut.innerText == "隠す";
                }
                for (let i = 0; i < new_deleted_num; i++) {
                    let new_deleted_input = new_deleted[i].getElementsByTagName("input")[0];
                    let new_deleted_input_id = new_deleted_input.id;
//                  console.log("res.js : new_deleted_input_id = " + new_deleted_input_id);
                    let deleted_input = document.getElementById(new_deleted_input_id);
                    if (deleted_input) {
                        let deleted_table = deleted_input.parentNode.parentNode.parentNode.parentNode;
                        if (deleted_table) {
                            if (deleted_table.className != "deleted") {
                                deleted_table.classList.add("deleted");
                                deleted_table.style.border = "2px dashed red";
                                let new_deleted_blockquote = new_deleted[i].getElementsByTagName("blockquote")[0];
                                let new_deleted_font = new_deleted_blockquote.getElementsByTagName("font")[0];
                                let new_deleted_text = new_deleted_font.innerText;
                                let deleted_font = document.createElement("font");
                                deleted_font.setAttribute("color","red");
                                deleted_font.innerText = new_deleted_text;
                                let deleted_br = document.createElement("br");
                                let deleted_blockquote = deleted_table.getElementsByTagName("blockquote")[0];
                                deleted_blockquote.insertBefore(deleted_br, deleted_blockquote.firstChild);
                                deleted_blockquote.insertBefore(deleted_font, deleted_blockquote.firstChild);
                                deleted_table.style.display = "table";
                            }
                        }
                    } else {
                        let new_deleted_table = new_deleted_input.parentNode.parentNode.parentNode.parentNode;
                        if (new_deleted_table) {
                            new_deleted_table.setAttribute("style", show_deleted_res ? "display: table;" : "display: none;");
                        }
                    }
                }
            }
        }

        let tables = thre.getElementsByTagName("table");
        let new_tables = new_thre.getElementsByTagName("table");
        let res_num = tables ? tables.length : 0;
        let new_res_num = new_tables ? new_tables.length : 0;
        
        if(res_num == new_res_num){
            this.notify.setText(`新しいレスはありません`);
            return;
        }
        
        if(new_res_num == 0){
            this.notify.setText(`スレの取得に失敗しました`);
            return;
        }

        for (let i = res_num, inserted = res_num == 0 ? thre.getElementsByTagName("blockquote")[0] : tables[res_num - 1]; i < new_res_num; ++i) {
            inserted = thre.insertBefore(new_tables[res_num], inserted.nextElementSibling);
        }

        this.notify.setText(`新着レス:${new_res_num - res_num}`);
        this.notify.moveTo(res_num - 1);

        document.dispatchEvent(new CustomEvent("KOSHIAN_reload"));
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
    let href_match = location.href.match(/^https?:\/\/(may|img)\.2chan\.net\/b\/res\/.+\.htm$/);
    let futabachin_link_id = document.getElementById("futabachin_link");
    if (href_match && use_futabachin_link && !futabachin_link_id) {
        let futabachin_link = href_match[0].replace(".2chan.net/",".2chin.net/");
        let futabachin_span = document.createElement("span");
        futabachin_span.innerText = " [";
        let futabachin_a = document.createElement("a");
        futabachin_a.id = "futabachin_link";
        futabachin_a.setAttribute("href", futabachin_link);
        futabachin_a.setAttribute("target", "_blank");
        futabachin_a.innerText = "2chin";
        futabachin_span.appendChild(futabachin_a);
        let futabachin_txt = document.createTextNode("]");
        futabachin_span.appendChild(futabachin_txt);
        let koshian_notify = document.getElementById("KOSHIAN_NOTIFY");
        koshian_notify.parentNode.insertBefore(futabachin_span, koshian_notify.nextSibling);
    }
}

function getTime() {
    return new Date().getTime();
}

let bottom_scroll_count = 0;
let last_bottom_scroll = getTime();

function isBottom(dy) {
    return (document.documentElement.scrollTop + document.documentElement.clientHeight == document.documentElement.scrollHeight) && (dy > 0);
}

function main() {
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
    refresh_deleted_res = safeGetValue(result.refresh_deleted_res, DEFAULT_REFRESH_DELETED_RES);
    use_futabachin_link = safeGetValue(result.use_futabachin_link, DEFAULT_USE_FUTABACHIN_LINK);

    main();
}, (error) => { });

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName != "local") {
        return;
    }

    scroll_period = safeGetValue(changes.scroll_period.newValue, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(changes.count_to_reload.newValue, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(changes.reload_period.newValue, DEFAULT_RELOAD_PERIOD);
    refresh_deleted_res = safeGetValue(changes.refresh_deleted_res.newValue, DEFAULT_REFRESH_DELETED_RES);
    use_futabachin_link = safeGetValue(changes.use_futabachin_link.newValue, DEFAULT_USE_FUTABACHIN_LINK);
});