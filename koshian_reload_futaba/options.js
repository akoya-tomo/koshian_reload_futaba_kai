const DEFAULT_SCROLL_PERIOD = 500;
const DEFAULT_COUNT_TO_RELOAD = 10;
const DEFAULT_RELOAD_PERIOD = 5000;
const DEFAULT_REPLACE_RELOAD_BUTTON = true;
const DEFAULT_REFRESH_DELETED_RES = false;
const DEFAULT_REFRESH_SOUDANE = false;
const DEFAULT_REFRESH_IDIP = false;
//const DEFAULT_USE_FUTABACHIN_LINK = false;
const DEFAULT_USE_FUTAPO_LINK = false;
const DEFAULT_SCROLL_TO_TOP = false;
let scroll_period = null;
let count_to_reload = null;
let reload_period = null;
let replace_reload_button = null;
let refresh_deleted_res = null;
let refresh_soudane = null;
let refresh_idip = null;
//let use_futabachin_link = null;
let use_futapo_link = null;
let scroll_to_top = null;

function onError(error) {
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

function saveSetting(e) {
    browser.storage.local.set({
        scroll_period: scroll_period.value,
        count_to_reload: count_to_reload.value,
        reload_period: reload_period.value,
        replace_reload_button:replace_reload_button.checked,
        refresh_deleted_res:refresh_deleted_res.checked,
        refresh_soudane:refresh_soudane.checked,
        refresh_idip:refresh_idip.checked,
        //use_futabachin_link:use_futabachin_link.checked,
        use_futapo_link:use_futapo_link.checked,
        scroll_to_top:scroll_to_top.checked
    });
}

function setCurrentChoice(result) {
    scroll_period.value = safeGetValue(result.scroll_period, DEFAULT_SCROLL_PERIOD);
    count_to_reload.value = safeGetValue(result.count_to_reload, DEFAULT_COUNT_TO_RELOAD);
    reload_period.value = safeGetValue(result.reload_period, DEFAULT_RELOAD_PERIOD);
    replace_reload_button.checked = safeGetValue(result.replace_reload_button, DEFAULT_REPLACE_RELOAD_BUTTON);    
    refresh_deleted_res.checked = safeGetValue(result.refresh_deleted_res, DEFAULT_REFRESH_DELETED_RES);    
    refresh_soudane.checked = safeGetValue(result.refresh_soudane, DEFAULT_REFRESH_SOUDANE);    
    refresh_idip.checked = safeGetValue(result.refresh_idip, DEFAULT_REFRESH_IDIP);    
    //use_futabachin_link.checked = safeGetValue(result.use_futabachin_link, DEFAULT_USE_FUTABACHIN_LINK);    
    use_futapo_link.checked = safeGetValue(result.use_futapo_link, DEFAULT_USE_FUTAPO_LINK);    
    scroll_to_top.checked = safeGetValue(result.scroll_to_top, DEFAULT_SCROLL_TO_TOP);    
}

function onLoad() {
    scroll_period = document.getElementById("scroll_period");
    count_to_reload = document.getElementById("count_to_reload");
    reload_period = document.getElementById("reload_period");
    replace_reload_button = document.getElementById("replace_reload_button");
    refresh_deleted_res = document.getElementById("refresh_deleted_res");
    refresh_soudane = document.getElementById("refresh_soudane");
    refresh_idip = document.getElementById("refresh_idip");
    //use_futabachin_link = document.getElementById("use_futabachin_link");
    use_futapo_link = document.getElementById("use_futapo_link");
    scroll_to_top = document.getElementById("scroll_to_top");

    scroll_period.addEventListener("change", saveSetting);
    count_to_reload.addEventListener("change", saveSetting);
    reload_period.addEventListener("change", saveSetting);
    replace_reload_button.addEventListener("change", saveSetting);
    refresh_deleted_res.addEventListener("change", saveSetting);
    refresh_soudane.addEventListener("change", saveSetting);
    refresh_idip.addEventListener("change", saveSetting);
    //use_futabachin_link.addEventListener("change", saveSetting);
    use_futapo_link.addEventListener("change", saveSetting);
    scroll_to_top.addEventListener("change", saveSetting);

    browser.storage.local.get().then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", onLoad);