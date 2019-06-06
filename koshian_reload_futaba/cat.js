const DEFAULT_SCROLL_PERIOD = 500;
const DEFAULT_COUNT_TO_RELOAD = 10;
const DEFAULT_RELOAD_PERIOD = 5000;
const DEFAULT_REPLACE_F5_KEY = false;
const DEFAULT_CHANGE_BG_COLOR = false;
const DEFAULT_SCROLL_TO_TOP = false;
const DEFAULT_USE_RELOAD_TIME = true;
const DEFAULT_SORT_CATALOG = false;
const DEFAULT_CAT_REL_BUTTON_SIZE = 16;
const DEFAULT_CAT_UNDO_BUTTON_SIZE = 16;
const DEFAULT_CAT_NOTIFY_SIZE = 16;
const DEFAULT_TIME_OUT = 60000;
let scroll_period = DEFAULT_SCROLL_PERIOD;
let count_to_reload = DEFAULT_COUNT_TO_RELOAD;
let reload_period = DEFAULT_RELOAD_PERIOD;
let replace_f5_key = DEFAULT_REPLACE_F5_KEY;
let change_bg_color = DEFAULT_CHANGE_BG_COLOR;
let scroll_to_top = DEFAULT_SCROLL_TO_TOP;
let use_reload_time = DEFAULT_USE_RELOAD_TIME;
let sort_catalog = DEFAULT_SORT_CATALOG;
let cat_rel_button_size = DEFAULT_CAT_REL_BUTTON_SIZE;
let cat_undo_button_size = DEFAULT_CAT_UNDO_BUTTON_SIZE;
let cat_notify_size = DEFAULT_CAT_NOTIFY_SIZE;
let time_out = DEFAULT_TIME_OUT;
let timer = null;
let cache = null;
let previous_sort = null;

class Notify {
    constructor() {
        let cat = document.getElementById("cattable") || document.querySelector('body > table[border]');
        [this.notify, this.text] = this.setNotify("KOSHIAN_NOTIFY", cat);
        [this.notify2, this.text2] = this.setNotify("KOSHIAN_NOTIFY2", cat.nextSibling);
    }
    
    setNotify(id, target) {
        if (Notify.hasNotify(id)) {
            let notify = document.getElementById(id);
            notify.style.fontSize = `${cat_notify_size}px`;
            let text = (function (parent) {
                for (let node = parent.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType == Node.TEXT_NODE) {
                        return node;
                    }
                }
                return parent.appendChild(document.createTextNode(""));
            })(notify);
            return [notify, text];

        } else {
            let notify = document.createElement("span");
            let text = document.createTextNode("");

            notify.id = id;
            notify.style.fontSize = `${cat_notify_size}px`;
            notify.appendChild(text);
            document.body.appendChild(notify);

            if (target) {
                target.parentNode.insertBefore(notify, target);
            }
            return [notify, text];
        }
    }

    setText(text, color = "", font_weight = "") {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        this.text.textContent = text;
        this.notify.style.color = color;
        this.notify.style.fontWeight = font_weight;

        this.text2.textContent = text;
        this.notify2.style.color = color;
        this.notify2.style.fontWeight = font_weight;
    }

    static hasNotify(id) {
        return document.getElementById(id);
    }
}

class Reloader {
    constructor() {
        this.notify = new Notify();
        this.loading = false;
        this.last_reload_time = getTime();
        this.timer = null;
    }

    reload(force = false, undo = false, href = location.href) {
        if (this.loading) {
            return;
        }

        let cur = getTime();

        if (!force && cur - this.last_reload_time < reload_period) {
            let time = reload_period - cur + this.last_reload_time;
            if (!this.notify.text.textContent || this.notify.text.textContent == " ") {
                this.notify.setText(`ホイールリロード規制中（あと${time}msec）`);
                timer = setTimeout(() => {
                    timer = null;
                    this.notify.setText(" ");
                }, Math.max(time, 2000));
            }
            return;
        } else {
            this.last_reload_time = cur;
        }

        let cat_bold = document.getElementById("KOSHIAN_reload_cat_bold");
        if (cat_bold && cat_bold.href) {
            href = cat_bold.href;
        }

        this.loading = true;
        if (undo) {
            if (cache) {
                this.refreshCat(cache, true);
            }
            this.loading = false;
            return;
        } else {
            let xhr = new XMLHttpRequest();
            xhr.responseType = "document";
            xhr.timeout = time_out;
            xhr.addEventListener("load", () => { this.onBodyLoad(xhr); });
            xhr.addEventListener("error", () => { this.onError(); });
            xhr.addEventListener("timeout", () => { this.onTimeout(); });
            xhr.open("GET", href);
            xhr.send();
            this.notify.setText(`カタログ取得中……`);
            changeBgColor();
        }
    }

    onBodyLoad(xhr){
        try{
            switch(xhr.status){
                case 200:
                    this.refreshCat(xhr.responseXML);
                    break;
                default:
                    this.notify.setText(`カタログ取得失敗 CODE:${xhr.status}`);
            }
        }catch(e){
            this.notify.setText(`カタログ取得失敗 CODE:${xhr.status}`);
            console.error("KOSHIAN_reload/cat.js/Reloader.onBodyLoad - " + e.name + ": " + e.message);
            console.dir(e);
        }

        this.loading = false;
        resetBgColor();
    }

    refreshCat(new_document, undo = false){
        if(!new_document){
            this.notify.setText(`カタログが空です`);
            return;
        }

        let cat = document.getElementById("cattable") || document.querySelector('body > table[border]');
        let new_cat = new_document.getElementById("cattable") || new_document.querySelector('body > table[border]');
        if(!cat || !new_cat){
            this.notify.setText(`カタログがありません`);
            return;
        }

        if (scroll_to_top) {
            document.documentElement.scrollTop = 0;
        }

        // アンドゥ情報取得
        cache = document.cloneNode(true);

        // 新カタログに書換
        if (sort_catalog) {
            new_cat.firstChild.style.opacity = 0;
        }
        cat.textContent = null; // カタログの子要素を全削除
        cat.appendChild(new_cat.firstChild);

        let time = use_reload_time ? `(${getTimeStrings()})` : " ";
        this.notify.setText(`更新完了${time}`);
        timer = setTimeout(() => {
            timer = null;
            this.notify.setText(time);
        }, Math.max(reload_period, 2000));

        if (undo) {
            removeUndoButton();
            removeUndoButton("2");
            if (previous_sort) {
                let cat_bold = document.getElementById("KOSHIAN_reload_cat_bold");
                if (cat_bold) {
                    cat_bold.id = "";
                    cat_bold.style.fontWeight = "";
                }
                previous_sort.id = "KOSHIAN_reload_cat_bold";
                previous_sort.style.fontWeight = "bold";
                previous_sort = null;
            }
        } else {
            setUndoButton(this, this.notify.notify);
            setUndoButton(this, this.notify.notify2, "2");
        }

        let has_catalog_sort = document.body.hasAttribute("__KOSHIAN_catalog_sort");
        if (sort_catalog && has_catalog_sort) {
            document.dispatchEvent(new CustomEvent("KOSHIAN_cat_sort", {
                detail: undo
            }));
        } else {
            document.dispatchEvent(new CustomEvent("KOSHIAN_cat_reload"));
        }

    }

    onError() {
        this.loading = false;
        this.notify.setText(`通信失敗`);
        resetBgColor();
    }

    onTimeout() {
        this.loading = false;
        this.notify.setText(`接続がタイムアウトしました`);
        resetBgColor();
    }
}

/**
 * 時刻取得
 * @return {string} 現在の時刻の文字列 h:mm:ss
 */
function getTimeStrings() {
    let now = new Date();
    let time = now.getHours() + ":" +
        ("0" + now.getMinutes()).slice(-2) + ":" +
        ("0" + now.getSeconds()).slice(-2);
    return time;
}
  
function getTime(){
    return new Date().getTime();
}

function isNoScroll() { // eslint-disable-line no-unused-vars
    return document.documentElement.clientHeight == document.documentElement.scrollHeight;
}

function isTop(dy) {
    return (document.documentElement.scrollTop == 0) && (dy < 0);
}

function isBottom(dy) {
    //console.log("KOSHIAN_reload/res.js scrollHeight: " + document.documentElement.scrollHeight);
    //console.log("KOSHIAN_reload/res.js scrollTop + clientHeight: " + (document.documentElement.scrollTop + document.documentElement.clientHeight));
    return (document.documentElement.scrollHeight - (document.documentElement.scrollTop + document.documentElement.clientHeight) <= 1) && (dy > 0);
}

function isCatalog() {
    return location.search.match(/mode=cat(&sort=.+)?$/);
}

let last_wheel_time = getTime();
let wheel_count = 0;

function main(){

    let reloader = new Reloader();

    if (scroll_to_top) {
        document.documentElement.scrollTop = 0;
    }

    if (isCatalog()) {
        let notify = document.getElementById("KOSHIAN_NOTIFY");
        if (notify) {
            setReloadButton(notify);
        }
        let notify2 = document.getElementById("KOSHIAN_NOTIFY2");
        if (notify2) {
            setReloadButton(notify2, "2");
        }
        removeUndoButton();
        removeUndoButton("2");

        setCatalogSortEvent();
    }

    document.addEventListener("wheel", (e) => {
        let cur = getTime();

        if(isBottom(e.deltaY) || isTop(e.deltaY)){
            if(cur - last_wheel_time < scroll_period){
                ++wheel_count;
                if(wheel_count > count_to_reload){
                    wheel_count = 0;
                    if (isCatalog()) {
                        reloader.reload(false);
                    } else {
                        location.reload(false);
                    }
                }
            }else{
                last_wheel_time = cur;
                wheel_count = 0;
            }
        }else{
            wheel_count = 0;
        }        
    });

    document.addEventListener("keydown", (e) => {
        if (e.key == "F5" && !e.ctrlKey) {
            e.preventDefault();
            if (replace_f5_key) {
                if (isCatalog()) {
                    reloader.reload(true);
                } else {
                    location.reload(false);
                }
            } else {
                let cat_bold = document.getElementById("KOSHIAN_reload_cat_bold");
                if (cat_bold) {
                    location.href = cat_bold.href;
                } else {
                    location.reload(false);
                }
            }
        }
    });

    function setReloadButton(target, id = "") {
        let reload_button = document.createElement("span");
        let anchor = document.createElement("a");
        reload_button.id = "KOSHIAN_cat_reload_button" + id;
        reload_button.style.fontSize = cat_rel_button_size > 0 ? `${cat_rel_button_size}px` : "";
        reload_button.style.display = cat_rel_button_size > 0 ? "" : "none";
        anchor.text = "リロード";
        anchor.href = "javascript:void(0)";
        anchor.addEventListener("click", () => {
            reloader.reload(true);
        });
        reload_button.append("[", anchor, "] ");
        let old_reload_button = document.getElementById(reload_button.id);
        if (old_reload_button) {
            old_reload_button.remove();
        }
        target.parentNode.insertBefore(reload_button, target);
    }

    function setCatalogSortEvent() {
        let bold_anchors = document.querySelectorAll("body > b > a");
        for (let bold_anchor of bold_anchors) {
            if (bold_anchor.href.match(/mode=cat(&sort=.+)?$/)) {
                bold_anchor.id = "KOSHIAN_reload_cat_bold";
                bold_anchor.style.fontWeight = "bold";
                removeBold(bold_anchor);
                break;
            }
        }
        let anchors = document.querySelectorAll("body > a");
        for (let anchor of anchors) {
            if (anchor.href.match(/mode=cat(&sort=.+)?$/)) {
                anchor.addEventListener("click", (e) => {
                    e.preventDefault();
                    let cat_bold = document.getElementById("KOSHIAN_reload_cat_bold");
                    if (cat_bold) {
                        previous_sort = cat_bold;
                        cat_bold.id = "";
                        cat_bold.style.fontWeight = "";
                    }
                    e.target.id = "KOSHIAN_reload_cat_bold";
                    e.target.style.fontWeight = "bold";
                    reloader.reload(true, false, e.target.href);
                });
            }
        }
        function removeBold(target) {
            target.parentNode.parentNode.replaceChild(target, target.parentNode);
        }
    }
}

function setUndoButton(reloader, target, id = "") {
    let undo_button = document.createElement("span");
    let anchor = document.createElement("a");
    undo_button.id = "KOSHIAN_cat_undo_button" + id;
    undo_button.style.fontSize = cat_undo_button_size > 0 ? `${cat_undo_button_size}px` : "";
    undo_button.style.display = cat_undo_button_size > 0 ? "" : "none";
    anchor.text = "UNDO";
    anchor.href = "javascript:void(0)";
    anchor.addEventListener("click", () => {
        reloader.reload(true, true);
    });
    undo_button.append("[", anchor, "] ");
    let old_undo_button = document.getElementById(undo_button.id);
    if (old_undo_button) {
        old_undo_button.remove();
    }
    target.parentNode.insertBefore(undo_button, target);
}

function removeUndoButton(id = "") {
    let undo_button = document.getElementById("KOSHIAN_cat_undo_button" + id);
    if (undo_button) {
        undo_button.remove();
    }
}

function setNotifyStyle() {
    let notify_list = [
        {id: "KOSHIAN_cat_reload_button", size: Math.max(cat_rel_button_size, 0)},
        {id: "KOSHIAN_cat_reload_button2", size: Math.max(cat_rel_button_size, 0)},
        {id: "KOSHIAN_cat_undo_button", size: Math.max(cat_undo_button_size, 0)},
        {id: "KOSHIAN_cat_undo_button2", size: Math.max(cat_undo_button_size, 0)},
        {id: "KOSHIAN_NOTIFY", size: Math.max(cat_notify_size, 1)},
        {id: "KOSHIAN_NOTIFY2", size: Math.max(cat_notify_size, 1)},
    ];
    for (let notify of notify_list) {
        let notify_elm = document.getElementById(notify.id);
        if (notify_elm) {
            notify_elm.style.fontSize = notify.size > 0 ? `${notify.size}px` : "";
            notify_elm.style.display = notify.size > 0 ? "" : "none";
        }
    }
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
    scroll_to_top = safeGetValue(result.scroll_to_top, DEFAULT_SCROLL_TO_TOP);
    use_reload_time = safeGetValue(result.use_reload_time, DEFAULT_USE_RELOAD_TIME);
    sort_catalog = safeGetValue(result.sort_catalog, DEFAULT_SORT_CATALOG);
    cat_rel_button_size = Math.max(Number(safeGetValue(result.cat_rel_button_size, DEFAULT_CAT_REL_BUTTON_SIZE)), 0);
    cat_undo_button_size = Math.max(Number(safeGetValue(result.cat_undo_button_size, DEFAULT_CAT_UNDO_BUTTON_SIZE)), 0);
    cat_notify_size = Math.max(Number(safeGetValue(result.cat_notify_size, DEFAULT_CAT_NOTIFY_SIZE)), 1);

    main();
}, (error) => {});  // eslint-disable-line no-unused-vars

browser.storage.onChanged.addListener((changes, areaName) => {
    if(areaName != "local"){
        return;
    }

    scroll_period = safeGetValue(changes.scroll_period.newValue, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(changes.count_to_reload.newValue, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(changes.reload_period.newValue, DEFAULT_RELOAD_PERIOD);
    replace_f5_key = safeGetValue(changes.replace_f5_key.newValue, DEFAULT_REPLACE_F5_KEY);
    change_bg_color = safeGetValue(changes.change_bg_color.newValue, DEFAULT_CHANGE_BG_COLOR);
    scroll_to_top = safeGetValue(changes.scroll_to_top.newValue, DEFAULT_SCROLL_TO_TOP);
    use_reload_time = safeGetValue(changes.use_reload_time.newValue, DEFAULT_USE_RELOAD_TIME);
    sort_catalog = safeGetValue(changes.sort_catalog.newValue, DEFAULT_SORT_CATALOG);
    cat_rel_button_size = Math.max(Number(safeGetValue(changes.cat_rel_button_size.newValue, DEFAULT_CAT_REL_BUTTON_SIZE)), 0);
    cat_undo_button_size = Math.max(Number(safeGetValue(changes.cat_undo_button_size.newValue, DEFAULT_CAT_UNDO_BUTTON_SIZE)), 0);
    cat_notify_size = Math.max(Number(safeGetValue(changes.cat_notify_size.newValue, DEFAULT_CAT_NOTIFY_SIZE)),1);

    setNotifyStyle();
});