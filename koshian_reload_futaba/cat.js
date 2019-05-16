//console.log("cat.js 1.0.22");
const DEFAULT_SCROLL_PERIOD = 500;
const DEFAULT_COUNT_TO_RELOAD = 10;
const DEFAULT_RELOAD_PERIOD = 5000;
const DEFAULT_SCROLL_TO_TOP = false;
const DEFAULT_TIME_OUT = 60000;
const DEFAULT_REPLACE_F5_KEY = false;
const DEFAULT_CAT_REL_BUTTON_SIZE = 16;
const DEFAULT_CAT_UNDO_BUTTON_SIZE = 16;
const DEFAULT_CAT_NOTIFY_SIZE = 16;
const DEFAULT_USE_RELOAD_TIME = true;
let scroll_period = DEFAULT_SCROLL_PERIOD;
let count_to_reload = DEFAULT_COUNT_TO_RELOAD;
let reload_period = DEFAULT_RELOAD_PERIOD;
let scroll_to_top = DEFAULT_SCROLL_TO_TOP;
let time_out = DEFAULT_TIME_OUT;
let replace_f5_key = DEFAULT_REPLACE_F5_KEY;
let cat_rel_button_size = DEFAULT_CAT_REL_BUTTON_SIZE;
let cat_undo_button_size = DEFAULT_CAT_UNDO_BUTTON_SIZE;
let cat_notify_size = DEFAULT_CAT_NOTIFY_SIZE;
let use_reload_time = DEFAULT_USE_RELOAD_TIME;
let timer = null;
let cache = null;

class Notify {
    constructor() {
        if (Notify.hasNotify()) {
            this.notify = document.getElementById("KOSHIAN_NOTIFY");
            this.notify.style.fontSize = `${cat_notify_size}px`;
            this.text = (function (parent) {
                for (let node = parent.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType == Node.TEXT_NODE) {
                        return node;
                    }
                }
                return parent.appendChild(document.createTextNode(""));
            })(this.notify);

        } else {
            this.notify = document.createElement("span");
            this.text = document.createTextNode("");

            this.notify.id = "KOSHIAN_NOTIFY";
            this.notify.style.fontSize = `${cat_notify_size}px`;
            this.notify.appendChild(this.text);
            document.body.appendChild(this.notify);

            let cat = document.getElementById("cattable") || document.querySelector('body > table[border="1"]');
            if (cat) {
                cat.parentNode.insertBefore(this.notify, cat);
            }
        }

        if (Notify.hasNotify2()) {
            this.notify2 = document.getElementById("KOSHIAN_NOTIFY2");
            this.notify2.style.fontSize = `${cat_notify_size}px`;
            this.text2 = (function (parent) {
                for (let node = parent.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType == Node.TEXT_NODE) {
                        return node;
                    }
                }
                return parent.appendChild(document.createTextNode(""));
            })(this.notify2);

        } else {
            this.notify2 = document.createElement("span");
            this.text2 = document.createTextNode("");

            this.notify2.id = "KOSHIAN_NOTIFY2";
            this.notify2.style.fontSize = `${cat_notify_size}px`;
            this.notify2.appendChild(this.text2);
            document.body.appendChild(this.notify2);

            let cat = document.getElementById("cattable") || document.querySelector('body > table[border="1"]');
            if (cat) {
                cat.parentNode.insertBefore(this.notify2, cat.nextSibling);
            }
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

    static hasNotify() {
        return document.getElementById("KOSHIAN_NOTIFY");
    }

    static hasNotify2() {
        return document.getElementById("KOSHIAN_NOTIFY2");
    }
}

class Reloader {
    constructor() {
        this.notify = new Notify();
        this.loading = false;
        this.last_reload_time = getTime();
        this.timer = null;
    }

    reload(force = false, undo = false) {
        if (this.loading) {
            return;
        }

        let cur = getTime();

        if (!force && cur - this.last_reload_time < reload_period) {
            let time = reload_period - cur + this.last_reload_time;
            if (!this.notify.text.textContent || this.notify.text.textContent == " ") {
                this.notify.setText(`�z�C�[�������[�h�K�����i����${time}msec�j`);
                timer = setTimeout(() => {
                    timer = null;
                    this.notify.setText(" ");
                }, Math.max(time, 2000));
            }
            return;
        } else {
            this.last_reload_time = cur;
        }

        this.loading = true;
        if (undo) {
            if (cache) this.refreshCat(cache, true);
            this.loading = false;
            return;
        } else {
            let xhr = new XMLHttpRequest();
            xhr.responseType = "document";
            xhr.timeout = time_out;
            xhr.addEventListener("load", () => { this.onBodyLoad(xhr); });
            xhr.addEventListener("error", () => { this.onError(); });
            xhr.addEventListener("timeout", () => { this.onTimeout(); });
            xhr.open("BODY", location.href);
            xhr.send();
            this.notify.setText(`�J�^���O�擾���c�c`);
        }
    }

    onBodyLoad(xhr){
        try{
            switch(xhr.status){
              case 200:  // eslint-disable-line indent
                this.refreshCat(xhr.responseXML);
                break;
              default:  // eslint-disable-line indent
                this.notify.setText(`�J�^���O�擾���s CODE:${xhr.status}`);
            }
        }catch(e){
            this.notify.setText(`�J�^���O�擾���s CODE:${xhr.status}`);
            console.error("KOSHIAN_reload/cat.js - onBodyLoad error: " + e);  // eslint-disable-line no-console
        }

        this.loading = false;
    }

    refreshCat(new_document, undo = false){
        if(!new_document){
            this.notify.setText(`�J�^���O����ł�`);
            return;
        }

        let cat = document.getElementById("cattable") || document.querySelector('body > table[border="1"]');
        let new_cat = new_document.getElementById("cattable") || new_document.querySelector('body > table[border="1"]');
        if(!cat || !new_cat){
            this.notify.setText(`�J�^���O������܂���`);
            return;
        }

        if (scroll_to_top) {
            document.documentElement.scrollTop = 0;
        }

        // �A���h�D���擾
        cache = document.cloneNode(true);
        // �V�J�^���O�ɏ���
        cat.textContent = null; // �J�^���O�̎q�v�f��S�폜
        cat.appendChild(new_cat.firstChild);

        let time = use_reload_time ? `(${getTimeStrings()})` : " ";
        this.notify.setText(`�X�V����${time}`);
        timer = setTimeout(() => {
            timer = null;
            this.notify.setText(time);
        }, Math.max(reload_period, 2000));

        if (undo) {
            removeUndoButton();
            removeUndoButton("2");
        } else {
            setUndoButton(this, this.notify.notify);
            setUndoButton(this, this.notify.notify2, "2");
        }

        document.dispatchEvent(new CustomEvent("KOSHIAN_cat_reload"));

    }

    onError() {
        this.loading = false;
        this.notify.setText(`�ʐM���s`);
    }

    onTimeout() {
        this.loading = false;
        this.notify.setText(`�ڑ����^�C���A�E�g���܂���`);
    }
}

/**
 * �����擾
 * @return {string} ���݂̎����̕����� h:mm:ss
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

function isNoScroll() {
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
    return location.search.match(/mode=cat/);
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
        let notify2 = document.getElementById("KOSHIAN_NOTIFY2");
        if (notify) {
            setReloadButton(notify);
            removeUndoButton();
        }
        if (notify2) {
            setReloadButton(notify2, "2");
            removeUndoButton("2");
        }
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
        if (e.key == "F5" && !e.ctrlKey && replace_f5_key) {
            e.preventDefault();
            if (isCatalog()) {
                reloader.reload(true);
            } else {
                location.reload(false);
            }
        }
    });

    function setReloadButton(target, id = "") {
        let reload_button = document.createElement("span");
        let anchor = document.createElement("a");
        reload_button.id = "KOSHIAN_cat_reload_button" + id;
        reload_button.style.fontSize = cat_rel_button_size ? `${cat_rel_button_size}px` : "";
        reload_button.style.display = cat_rel_button_size ? "" : "none";
        anchor.text = "�����[�h";
        anchor.href = "javascript:void(0)";
        anchor.addEventListener("click", () => {
            reloader.reload(true);
        });
        reload_button.append("[", anchor, "]");
        let old_reload_button = document.getElementById(reload_button.id);
        if (old_reload_button) old_reload_button.remove();
        target.parentNode.insertBefore(reload_button, target);
    }
}

function setUndoButton(reloader, target, id = "") {
    let undo_button = document.createElement("span");
    let anchor = document.createElement("a");
    undo_button.id = "KOSHIAN_cat_undo_button" + id;
    undo_button.style.fontSize = cat_undo_button_size ? `${cat_undo_button_size}px` : "";
    undo_button.style.display = cat_undo_button_size ? "" : "none";
    anchor.text = "UNDO";
    anchor.href = "javascript:void(0)";
    anchor.addEventListener("click", () => {
        reloader.reload(true, true);
    });
    undo_button.append("[", anchor, "]");
    let old_undo_button = document.getElementById(undo_button.id);
    if (old_undo_button) old_undo_button.remove();
    target.parentNode.insertBefore(undo_button, target);
}

function removeUndoButton(id = "") {
    let undo_button = document.getElementById("KOSHIAN_cat_undo_button" + id);
    if (undo_button) undo_button.remove();
}

function setNotifyStyle() {
    let reload_button = document.getElementById("KOSHIAN_cat_reload_button");
    if (reload_button) {
        reload_button.style.fontSize = cat_rel_button_size ? `${cat_rel_button_size}px` : "";
        reload_button.style.display = cat_rel_button_size ? "" : "none";
    }

    let reload_button2 = document.getElementById("KOSHIAN_cat_reload_button2");
    if (reload_button2) {
        reload_button2.style.fontSize = cat_rel_button_size ? `${cat_rel_button_size}px` : "";
        reload_button2.style.display = cat_rel_button_size ? "" : "none";
    }

    let undo_button = document.getElementById("KOSHIAN_cat_undo_button");
    if (undo_button) {
        undo_button.style.fontSize = cat_undo_button_size ? `${cat_undo_button_size}px` : "";
        undo_button.style.display = cat_undo_button_size ? "" : "none";
    }

    let undo_button2 = document.getElementById("KOSHIAN_cat_undo_button2");
    if (undo_button2) {
        undo_button2.style.fontSize = cat_undo_button_size ? `${cat_undo_button_size}px` : "";
        undo_button2.style.display = cat_undo_button_size ? "" : "none";
    }

    let notify = document.getElementById("KOSHIAN_NOTIFY");
    if (notify) {
        notify.style.fontSize = `${cat_notify_size}px`;
    }

    let notify2 = document.getElementById("KOSHIAN_NOTYIY2");
    if (notify2) {
        notify2.style.fontSize = `${cat_notify_size}px`;
    }
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

browser.storage.local.get().then((result) => {
    scroll_period = safeGetValue(result.scroll_period, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(result.count_to_reload, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(result.reload_period, DEFAULT_RELOAD_PERIOD);
    scroll_to_top = safeGetValue(result.scroll_to_top, DEFAULT_SCROLL_TO_TOP);
    replace_f5_key = safeGetValue(result.replace_f5_key, DEFAULT_REPLACE_F5_KEY);
    cat_rel_button_size = safeGetValue(result.cat_rel_button_size, DEFAULT_CAT_REL_BUTTON_SIZE);
    cat_undo_button_size = safeGetValue(result.cat_undo_button_size, DEFAULT_CAT_UNDO_BUTTON_SIZE);
    cat_notify_size = safeGetValue(result.cat_notify_size, DEFAULT_CAT_NOTIFY_SIZE);
    use_reload_time = safeGetValue(result.use_reload_time, DEFAULT_USE_RELOAD_TIME);

    main();
}, (error) => {});

browser.storage.onChanged.addListener((changes, areaName) => {
    if(areaName != "local"){
        return;
    }

    scroll_period = safeGetValue(changes.scroll_period.newValue, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(changes.count_to_reload.newValue, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(changes.reload_period.newValue, DEFAULT_RELOAD_PERIOD);
    scroll_to_top = safeGetValue(changes.scroll_to_top.newValue, DEFAULT_SCROLL_TO_TOP);
    replace_f5_key = safeGetValue(changes.replace_f5_key.newValue, DEFAULT_REPLACE_F5_KEY);
    cat_rel_button_size = safeGetValue(changes.cat_rel_button_size.newValue, DEFAULT_CAT_REL_BUTTON_SIZE);
    cat_undo_button_size = safeGetValue(changes.cat_undo_button_size.newValue, DEFAULT_CAT_UNDO_BUTTON_SIZE);
    cat_notify_size = safeGetValue(changes.cat_notify_size.newValue, DEFAULT_CAT_NOTIFY_SIZE);
    use_reload_time = safeGetValue(changes.use_reload_time.newValue, DEFAULT_USE_RELOAD_TIME);

    setNotifyStyle();
});