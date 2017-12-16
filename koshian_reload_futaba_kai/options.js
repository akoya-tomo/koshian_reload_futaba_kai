const DEFAULT_SCROLL_PERIOD = 500;
const DEFAULT_COUNT_TO_RELOAD = 10;
const DEFAULT_RELOAD_PERIOD = 5000;
const DEFAULT_REPLACE_RELOAD_BUTTON = true;
let scroll_period = null;
let count_to_reload = null;
let reload_period = null;
let replace_reload_button = null;

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
        replace_reload_button:replace_reload_button.checked
    });
}

function setCurrentChoice(result) {
    scroll_period.value = safeGetValue(result.scroll_period, DEFAULT_SCROLL_PERIOD);
    count_to_reload.value = safeGetValue(result.count_to_reload, DEFAULT_COUNT_TO_RELOAD);
    reload_period.value = safeGetValue(result.reload_period, DEFAULT_RELOAD_PERIOD);
    replace_reload_button.checked = safeGetValue(result.replace_reload_button, DEFAULT_REPLACE_RELOAD_BUTTON);    
}

function onLoad() {
    scroll_period = document.getElementById("scroll_period");
    count_to_reload = document.getElementById("count_to_reload");
    reload_period = document.getElementById("reload_period");
    replace_reload_button = document.getElementById("replace_reload_button");

    scroll_period.addEventListener("change", saveSetting);
    count_to_reload.addEventListener("change", saveSetting);
    reload_period.addEventListener("change", saveSetting);
    replace_reload_button.addEventListener("change", saveSetting);

    browser.storage.local.get().then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", onLoad);