//console.log("cat.js 1.0.22");
const DEFAULT_SCROLL_PERIOD = 500;
const DEFAULT_COUNT_TO_RELOAD = 10;
const DEFAULT_RELOAD_PERIOD = 5000;
let scroll_period = DEFAULT_SCROLL_PERIOD;
let count_to_reload = DEFAULT_COUNT_TO_RELOAD;
let reload_period = DEFAULT_RELOAD_PERIOD;
let last_time = new Date().getTime();
let last_reload = new Date().getTime();
let count = 0;
let documentElement = document.documentElement;

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
    return (document.documentElement.scrollTop + documentElement.clientHeight == document.documentElement.scrollHeight) && (dy > 0);
}

let last_wheel_time = getTime();
let wheel_count = 0;

function main(){
    document.addEventListener("wheel", (e) => {
        let cur = getTime();

        if(isBottom(e.deltaY) || isTop(e.deltaY)){
            if(cur - last_wheel_time < scroll_period){
                ++wheel_count;
                if(wheel_count > count_to_reload){
                    wheel_count = 0;
                    location.reload(false);
                }
            }else{
                last_wheel_time = cur;
                wheel_count = 0;
            }
        }else{
            wheel_count = 0;
        }        
    });
}

function safeGetValue(value, default_value) {
    return value === undefined ? default_value : value;
}

browser.storage.local.get().then((result) => {
    scroll_period = safeGetValue(result.scroll_period, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(result.count_to_reload, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(result.reload_period, DEFAULT_RELOAD_PERIOD);

    main();
}, (error) => {});

browser.storage.onChanged.addListener((changes, areaName) => {
    if(areaName != "local"){
        return;
    }

    scroll_period = safeGetValue(changes.scroll_period.newValue, DEFAULT_SCROLL_PERIOD);
    count_to_reload = safeGetValue(changes.count_to_reload.newValue, DEFAULT_COUNT_TO_RELOAD);
    reload_period = safeGetValue(changes.reload_period.newValue, DEFAULT_RELOAD_PERIOD);
});