const DEFAULT_SCROLL_PERIOD = 500;
const DEFAULT_COUNT_TO_RELOAD = 10;
const DEFAULT_RELOAD_PERIOD = 5000;
const DEFAULT_REPLACE_F5_KEY = false;
const DEFAULT_CHANGE_BG_COLOR = false;
const DEFAULT_SHOW_DELETED_RES = true;
const DEFAULT_REFRESH_DELETED_RES = true;
const DEFAULT_REFRESH_SOUDANE = true;
const DEFAULT_REFRESH_IDIP = true;
const DEFAULT_USE_FUTAPO_LINK = false;
const DEFAULT_USE_FTBUCKET_LINK = false;
const DEFAULT_USE_TSUMANNE_LINK = false;
const DEFAULT_USE_FUTAFUTA_LINK = false;
const DEFAULT_USE_CATPAGE_RELOAD = false;
const DEFAULT_USE_CATTABLE_RELOAD = true;
const DEFAULT_SCROLL_TO_TOP = false;
const DEFAULT_USE_RELOAD_TIME = true;
const DEFAULT_SORT_CATALOG = false;
const DEFAULT_CAT_REL_BUTTON_SIZE = 16;
const DEFAULT_CAT_UNDO_BUTTON_SIZE = 16;
const DEFAULT_CAT_NOTIFY_SIZE = 16;
const DEFAULT_CAT_REORDER_BUTTON_SIZE = 16;
let scroll_period = null;
let count_to_reload = null;
let reload_period = null;
let replace_f5_key = null;
let change_bg_color = null;
let show_deleted_res = null;
let refresh_deleted_res = null;
let refresh_soudane = null;
let refresh_idip = null;
let use_futapo_link = null;
let use_ftbucket_link = null;
let use_tsumanne_link = null;
let use_futafuta_link = null;
let use_catpage_reload = null;
let use_cattable_reload = null;
let scroll_to_top = null;
let use_reload_time = null;
let sort_catalog = null;
let cat_rel_button_size = null;
let cat_undo_button_size = null;
let cat_notify_size = null;
let cat_reorder_button_size = null;

function onError(error) {   // eslint-disable-line no-unused-vars
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

function saveSetting(e) {   // eslint-disable-line no-unused-vars
    browser.storage.local.set({
        scroll_period: scroll_period.value,
        count_to_reload: count_to_reload.value,
        reload_period: reload_period.value,
        replace_f5_key:replace_f5_key.checked,
        change_bg_color:change_bg_color.checked,
        show_deleted_res:show_deleted_res.checked,
        refresh_deleted_res:refresh_deleted_res.checked,
        refresh_soudane:refresh_soudane.checked,
        refresh_idip:refresh_idip.checked,
        use_futapo_link:use_futapo_link.checked,
        use_ftbucket_link:use_ftbucket_link.checked,
        use_tsumanne_link:use_tsumanne_link.checked,
        use_futafuta_link:use_futafuta_link.checked,
        use_catpage_reload:use_catpage_reload.checked,
        use_cattable_reload:use_cattable_reload.checked,
        scroll_to_top:scroll_to_top.checked,
        use_reload_time:use_reload_time.checked,
        sort_catalog:sort_catalog.checked,
        cat_rel_button_size: cat_rel_button_size.value,
        cat_undo_button_size: cat_undo_button_size.value,
        cat_notify_size: cat_notify_size.value,
        cat_reorder_button_size: cat_reorder_button_size.value
    });

    use_reload_time.disabled = use_catpage_reload.checked;
    sort_catalog.disabled = use_catpage_reload.checked;
    cat_rel_button_size.disabled = use_catpage_reload.checked;
    cat_undo_button_size.disabled = use_catpage_reload.checked;
    cat_notify_size.disabled = use_catpage_reload.checked;
    cat_reorder_button_size.disabled = use_catpage_reload.checked;
}

function setCurrentChoice(result) {
    scroll_period.value = safeGetValue(result.scroll_period, DEFAULT_SCROLL_PERIOD);
    count_to_reload.value = safeGetValue(result.count_to_reload, DEFAULT_COUNT_TO_RELOAD);
    reload_period.value = safeGetValue(result.reload_period, DEFAULT_RELOAD_PERIOD);
    replace_f5_key.checked = safeGetValue(result.replace_f5_key, DEFAULT_REPLACE_F5_KEY);
    change_bg_color.checked = safeGetValue(result.change_bg_color, DEFAULT_CHANGE_BG_COLOR);
    show_deleted_res.checked = safeGetValue(result.show_deleted_res, DEFAULT_SHOW_DELETED_RES);
    refresh_deleted_res.checked = safeGetValue(result.refresh_deleted_res, DEFAULT_REFRESH_DELETED_RES);
    refresh_soudane.checked = safeGetValue(result.refresh_soudane, DEFAULT_REFRESH_SOUDANE);
    refresh_idip.checked = safeGetValue(result.refresh_idip, DEFAULT_REFRESH_IDIP);
    use_futapo_link.checked = safeGetValue(result.use_futapo_link, DEFAULT_USE_FUTAPO_LINK);
    use_ftbucket_link.checked = safeGetValue(result.use_ftbucket_link, DEFAULT_USE_FTBUCKET_LINK);
    use_tsumanne_link.checked = safeGetValue(result.use_tsumanne_link, DEFAULT_USE_TSUMANNE_LINK);
    use_futafuta_link.checked = safeGetValue(result.use_futafuta_link, DEFAULT_USE_FUTAFUTA_LINK);
    use_catpage_reload.checked = safeGetValue(result.use_catpage_reload, DEFAULT_USE_CATPAGE_RELOAD);
    use_cattable_reload.checked = safeGetValue(result.use_cattable_reload, DEFAULT_USE_CATTABLE_RELOAD);
    scroll_to_top.checked = safeGetValue(result.scroll_to_top, DEFAULT_SCROLL_TO_TOP);
    use_reload_time.checked = safeGetValue(result.use_reload_time, DEFAULT_USE_RELOAD_TIME);
    sort_catalog.checked = safeGetValue(result.sort_catalog, DEFAULT_SORT_CATALOG);
    cat_rel_button_size.value = safeGetValue(result.cat_rel_button_size, DEFAULT_CAT_REL_BUTTON_SIZE);
    cat_undo_button_size.value = safeGetValue(result.cat_undo_button_size, DEFAULT_CAT_UNDO_BUTTON_SIZE);
    cat_notify_size.value = safeGetValue(result.cat_notify_size, DEFAULT_CAT_NOTIFY_SIZE);
    cat_reorder_button_size.value = safeGetValue(result.cat_reorder_button_size, DEFAULT_CAT_REORDER_BUTTON_SIZE);

    use_reload_time.disabled = use_catpage_reload.checked;
    sort_catalog.disabled = use_catpage_reload.checked;
    cat_rel_button_size.disabled = use_catpage_reload.checked;
    cat_undo_button_size.disabled = use_catpage_reload.checked;
    cat_notify_size.disabled = use_catpage_reload.checked;
    cat_reorder_button_size.disabled = use_catpage_reload.checked;
}

function onLoad() {
    scroll_period = document.getElementById("scroll_period");
    count_to_reload = document.getElementById("count_to_reload");
    reload_period = document.getElementById("reload_period");
    replace_f5_key = document.getElementById("replace_f5_key");
    change_bg_color = document.getElementById("change_bg_color");
    show_deleted_res = document.getElementById("show_deleted_res");
    refresh_deleted_res = document.getElementById("refresh_deleted_res");
    refresh_soudane = document.getElementById("refresh_soudane");
    refresh_idip = document.getElementById("refresh_idip");
    use_futapo_link = document.getElementById("use_futapo_link");
    use_ftbucket_link = document.getElementById("use_ftbucket_link");
    use_tsumanne_link = document.getElementById("use_tsumanne_link");
    use_futafuta_link = document.getElementById("use_futafuta_link");
    use_catpage_reload = document.getElementById("use_catpage_reload");
    use_cattable_reload = document.getElementById("use_cattable_reload");
    scroll_to_top = document.getElementById("scroll_to_top");
    use_reload_time = document.getElementById("use_reload_time");
    sort_catalog = document.getElementById("sort_catalog");
    cat_rel_button_size = document.getElementById("cat_rel_button_size");
    cat_undo_button_size = document.getElementById("cat_undo_button_size");
    cat_notify_size = document.getElementById("cat_notify_size");
    cat_reorder_button_size = document.getElementById("cat_reorder_button_size");

    let inputs = document.getElementsByTagName("input");
    for (let input of inputs) {
        input.onchange = saveSetting;
    }

    browser.storage.local.get().then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", onLoad);