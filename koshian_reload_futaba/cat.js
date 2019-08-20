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
const DEFAULT_CAT_REORDER_BUTTON_SIZE = 16;
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
let cat_reorder_button_size = DEFAULT_CAT_REORDER_BUTTON_SIZE;
let time_out = DEFAULT_TIME_OUT;
let timer_notify = null;
let undo_cache = null;
let reorder_cache = null;
let previous_sort = null;
let undo_time = "";
let previous_time = "";

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
            let container = document.createElement("div");
            let left_item = document.createElement("div");
            let right_item = document.createElement("div");
            let notify = document.createElement("span");
            let text = document.createTextNode("");

            container.id = `${id}_container`;
            container.style.display = "flex";
            container.style.justifyContent = "space-between";
            left_item.id = `${id}_left_item`;
            right_item.id = `${id}_right_item`;
            notify.id = id;
            notify.style.fontSize = `${cat_notify_size}px`;
            notify.appendChild(text);
            left_item.appendChild(notify);
            container.append(left_item,right_item);

            if (target) {
                target.parentNode.insertBefore(container, target);
            }
            return [notify, text];
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

        this.text2.textContent = text;
        this.notify2.style.color = color;
        this.notify2.style.fontWeight = font_weight;
    }

    static hasNotify(id = "KOSHIAN_NOTIFY") {
        return document.getElementById(id);
    }
}

class Reloader {
    constructor() {
        this.notify = new Notify();
        this.loading = false;
        this.last_reload_time = getTime();
    }

    reload(force = false, undo = false, reorder = false, href = location.href) {
        if (this.loading) {
            return;
        }

        let cur = getTime();

        if (!force && cur - this.last_reload_time < reload_period && !timer_notify) {
            let time = reload_period - cur + this.last_reload_time;
            if (!this.notify.text.textContent || this.notify.text.textContent == " ") {
                this.notify.setText(`ホイールリロード規制中（あと${time}msec）`);
                timer_notify = setTimeout(() => {
                    timer_notify = null;
                    this.notify.setText(" ");
                    last_wheel_time = getTime();
                    wheel_count = 0;
                }, Math.max(time, 2000));
            }
            return;
        } else if (!reorder) {
            this.last_reload_time = cur;
        }

        let cat_bold = document.getElementById("KOSHIAN_reload_cat_bold");
        if (cat_bold && cat_bold.href) {
            href = cat_bold.href;
        }

        this.loading = true;
        if (undo) {
            if (undo_cache) {
                this.refreshCatalog(undo_cache, true);
            }
            this.loading = false;
            last_wheel_time = getTime();
            wheel_count = 0;
            return;
        } else if (reorder) {
            if (reorder_cache) {
                this.refreshCatalog(reorder_cache, false, true);
            }
            this.loading = false;
            last_wheel_time = getTime();
            wheel_count = 0;
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
                    this.refreshCatalog(xhr.responseXML);
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
        last_wheel_time = getTime();
        wheel_count = 0;
    }

    refreshCatalog(new_document, undo = false, reorder = false) {
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

        // アンドゥ情報記憶
        if (!reorder) {
            undo_cache = document.cloneNode(true);
        }

        // 新カタログに書換
        let new_tbody = document.importNode(new_cat.firstChild, true);
        let has_catalog_sort = document.body.hasAttribute("__KOSHIAN_catalog_sort");
        if (sort_catalog && has_catalog_sort) {
            new_tbody.style.opacity = 0;
        }
        cat.textContent = null; // カタログの子要素を全削除
        cat.appendChild(new_tbody);

        // 通常順情報記憶
        reorder_cache = document.cloneNode(true);

        if (!reorder) {
            let time = use_reload_time ? (undo ? undo_time : `(${getTimeStrings()})`) : " ";
            this.notify.setText(`更新完了${time}`);
            timer_notify = setTimeout(() => {
                timer_notify = null;
                this.notify.setText(time);
            }, Math.max(reload_period, 2000));
            undo_time = previous_time;
            previous_time = time;
        }

        if (undo) {
            removeButton("KOSHIAN_cat_undo_button");
            removeButton("KOSHIAN_cat_undo_button2");
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
        } else if (!reorder) {
            setUndoButton(this, this.notify.notify, "KOSHIAN_cat_undo_button");
            setUndoButton(this, this.notify.notify2, "KOSHIAN_cat_undo_button2");
        }

        if (has_catalog_sort) {
            setReorderButton(this, "KOSHIAN_NOTIFY_right_item", "KOSHIAN_cat_reorder_normal_button", "KOSHIAN_cat_reorder_inc_button");
            setReorderButton(this, "KOSHIAN_NOTIFY2_right_item", "KOSHIAN_cat_reorder_normal_button2", "KOSHIAN_cat_reorder_inc_button2");
        } else {
            removeButton("KOSHIAN_cat_reorder_normal_button");
            removeButton("KOSHIAN_cat_reorder_normal_button2");
            removeButton("KOSHIAN_cat_reorder_inc_button");
            removeButton("KOSHIAN_cat_reorder_inc_button2");
        }
        if ((sort_catalog || reorder) && has_catalog_sort) {
            document.dispatchEvent(new CustomEvent("KOSHIAN_cat_sort", {
                detail: sort_catalog * 1 + undo * 2 + reorder * 4
            }));
        } else {
            document.dispatchEvent(new CustomEvent("KOSHIAN_cat_reload"));
        }

    }

    onError() {
        this.loading = false;
        this.notify.setText(`通信失敗`);
        resetBgColor();
        last_wheel_time = getTime();
        wheel_count = 0;
    }

    onTimeout() {
        this.loading = false;
        this.notify.setText(`接続がタイムアウトしました`);
        resetBgColor();
        last_wheel_time = getTime();
        wheel_count = 0;
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
    return (document.documentElement.scrollTop <= 1) && (dy < 0);
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
            setReloadButton(notify, "KOSHIAN_cat_reload_button");
        }
        let notify2 = document.getElementById("KOSHIAN_NOTIFY2");
        if (notify2) {
            setReloadButton(notify2, "KOSHIAN_cat_reload_button2");
        }
        removeButton("KOSHIAN_cat_undo_button");
        removeButton("KOSHIAN_cat_undo_button2");
        removeButton("KOSHIAN_cat_reorder_normal_button");
        removeButton("KOSHIAN_cat_reorder_normal_button2");
        removeButton("KOSHIAN_cat_reorder_inc_button");
        removeButton("KOSHIAN_cat_reorder_inc_button2");

        setCatalogSortEvent();

        previous_time = `(${getTimeStrings()})`;
    }

    document.addEventListener("wheel", (e) => {
        let cur = getTime();

        if(isBottom(e.deltaY) || isTop(e.deltaY)){
            if(cur - last_wheel_time < scroll_period && !reloader.loading && !timer_notify){
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

    function setReloadButton(target, id) {
        let reload_button = document.createElement("span");
        let anchor = document.createElement("a");
        reload_button.id = id;
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
                    reloader.reload(true, false, false, e.target.href);
                });
            }
        }
        function removeBold(target) {
            target.parentNode.parentNode.replaceChild(target, target.parentNode);
        }
    }
}

function setUndoButton(reloader, target, id) {
    let undo_button = document.createElement("span");
    let anchor = document.createElement("a");
    undo_button.id = id;
    undo_button.style.fontSize = cat_undo_button_size > 0 ? `${cat_undo_button_size}px` : "";
    undo_button.style.display = cat_undo_button_size > 0 ? "" : "none";
    anchor.text = "UNDO";
    anchor.href = "javascript:void(0)";
    anchor.addEventListener("click", () => {
        reloader.reload(true, true);
    });
    undo_button.append("[", anchor, "] ");

    removeButton(undo_button.id);
    target.parentNode.insertBefore(undo_button, target);
}

function removeButton(id) {
    let button = document.getElementById(id);
    if (button) {
        button.remove();
    }
}

function setReorderButton(reloader, parent_id, normal_id, inc_id) {
    let parent = document.getElementById(parent_id);
    let reorder_normal_button = document.createElement("span");
    let anchor_normal = document.createElement("a");
    reorder_normal_button.id = normal_id;
    reorder_normal_button.style.fontSize = cat_reorder_button_size > 0 ? `${cat_reorder_button_size}px` : "";
    reorder_normal_button.style.display = cat_reorder_button_size > 0 ? "" : "none";
    anchor_normal.className = "KOSHIAN_cat_reorder_normal_anchor";
    anchor_normal.text = "通常順";
    anchor_normal.href = "javascript:void(0)";
    anchor_normal.addEventListener("click", () => {
        if (sort_catalog) {
            let normal_anchors = document.getElementsByClassName("KOSHIAN_cat_reorder_normal_anchor");
            for (let anchor of normal_anchors) {
                anchor.style.fontWeight = "bold";
            }
            let inc_anchors = document.getElementsByClassName("KOSHIAN_cat_reorder_inc_anchor");
            for (let anchor of inc_anchors) {
                anchor.style.fontWeight = "";
            }
            sort_catalog = false;
            reloader.reload(true, false, true);
        }
    });
    reorder_normal_button.append("[", anchor_normal, "] ");

    let reorder_inc_button = document.createElement("span");
    let anchor_inc = document.createElement("a");
    reorder_inc_button.id = inc_id;
    reorder_inc_button.style.fontSize = cat_reorder_button_size > 0 ? `${cat_reorder_button_size}px` : "";
    reorder_inc_button.style.display = cat_reorder_button_size > 0 ? "" : "none";
    anchor_inc.className = "KOSHIAN_cat_reorder_inc_anchor";
    anchor_inc.text = "増加順";
    anchor_inc.href = "javascript:void(0)";
    anchor_inc.addEventListener("click", () => {
        if (!sort_catalog) {
            let normal_anchors = document.getElementsByClassName("KOSHIAN_cat_reorder_normal_anchor");
            for (let anchor of normal_anchors) {
                anchor.style.fontWeight = "";
            }
            let inc_anchors = document.getElementsByClassName("KOSHIAN_cat_reorder_inc_anchor");
            for (let anchor of inc_anchors) {
                anchor.style.fontWeight = "bold";
            }
            sort_catalog = true;
            reloader.reload(true, false, true);
        }
    });
    reorder_inc_button.append("[", anchor_inc, "] ");
    if (sort_catalog) {
        anchor_normal.style.fontWeight = "";
        anchor_inc.style.fontWeight = "bold";
    } else {
        anchor_normal.style.fontWeight = "bold";
        anchor_inc.style.fontWeight = "";
    }

    removeButton(normal_id);
    removeButton(inc_id);
    parent.append(reorder_normal_button, reorder_inc_button);
}

function setNotifyStyle() {
    let notify_list = [
        {id: "KOSHIAN_cat_reload_button", size: Math.max(cat_rel_button_size, 0)},
        {id: "KOSHIAN_cat_reload_button2", size: Math.max(cat_rel_button_size, 0)},
        {id: "KOSHIAN_cat_undo_button", size: Math.max(cat_undo_button_size, 0)},
        {id: "KOSHIAN_cat_undo_button2", size: Math.max(cat_undo_button_size, 0)},
        {id: "KOSHIAN_NOTIFY", size: Math.max(cat_notify_size, 1)},
        {id: "KOSHIAN_NOTIFY2", size: Math.max(cat_notify_size, 1)},
        {id: "KOSHIAN_cat_reorder_normal_button", size: Math.max(cat_reorder_button_size, 0)},
        {id: "KOSHIAN_cat_reorder_normal_button2", size: Math.max(cat_reorder_button_size, 0)},
        {id: "KOSHIAN_cat_reorder_inc_button", size: Math.max(cat_reorder_button_size, 0)},
        {id: "KOSHIAN_cat_reorder_inc_button2", size: Math.max(cat_reorder_button_size, 0)},
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
    cat_reorder_button_size = Math.max(Number(safeGetValue(result.cat_reorder_button_size, DEFAULT_CAT_REORDER_BUTTON_SIZE)), 0);

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
    cat_reorder_button_size = Math.max(Number(safeGetValue(changes.cat_reorder_button_size.newValue, DEFAULT_CAT_REORDER_BUTTON_SIZE)), 0);

    setNotifyStyle();
});
