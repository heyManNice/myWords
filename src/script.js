const TRAY_EVENT={
    settings:1
}

//window.Niva&&Niva.api.webview.openDevtools();

CONFIG={};
AllWords=[];

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
Niva.addEventListener("window.message",async function(eventName,payload){
    switch (payload.message) {
        case "reloadConfig":
            await loadConfig();
            break;
        case "reloadCard":
            let card_element = document.querySelector(".card");
            card_element.style.transform = "translateY(-150px)";
            await sleep(300);
            location.reload();
            break;
        default:
            break;
    }
});

Niva.addEventListener("menu.clicked",async function(eventName,eventId){
    switch (eventId) {
        case TRAY_EVENT.settings:{
            let windowsList = await Niva.api.window.list();
            let index = windowsList.findIndex((item)=>{
                return item.title==="Settings";
            });
            if(index!=-1){
                let windowId = windowsList[index].id;
                let isMinimized = await Niva.api.window.isMinimized(windowId);
                if(isMinimized){
                    //setMinimized可以用于恢复最小化窗口
                    Niva.api.window.setMinimized(false,windowId);
                    return;
                }
                Niva.api.window.setFocus(windowId);
                return
            }
            Niva.api.window.open({
                "entry":"src/setting.html",
                "icon":"assets/logo.png",
                "title":"Settings",
                "size":{
                    "width":800,
                    "height":600
                }
            });
            break;
        }
        default:
            break;
    }
});


main();

//在下方实现函数
//============================================

/**
 * @param {string} file 文件名
 * @returns {Promise} resolve(Json)
 * @description 从assets/words目录下获取json文件的内容
 */
function getWords(file){
    return new Promise(( resolve, reject ) => {
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                let Json;
                try{
                    Json = JSON.parse(this.responseText);
                }catch{
                    reject({code:0,msg:"未知错误，请联系管理员"});
                    return
                }
                resolve(Json);
            }
        });
        xhr.open("GET", "../assets/words/" + file + ".json");
        xhr.send();
    });
}

/**
 * @param {number} ms 毫秒
 * @returns {Promise} resolve()
 * @description 延迟ms毫秒
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @description 鼠标进入卡片时隐藏窗口
 */
async function mouseEnterCard(){
    if(CONFIG.autoHide=="false"){
        return;
    }
    let card_element = document.querySelector(".card");
    card_element.style.transform = "translateY(-150px)";
    await sleep(300);
    Niva.api.window.setVisible(false);
    await sleep(5000);
    Niva.api.window.setVisible(true);
    card_element.style.transform = "translateY(0px)";
}

/**
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {number} 随机数
 * @description 获取随机数
 */
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {object} data 单词数据
 * @param {number} data.id 单词的id
 * @param {string} data.word 单词本身
 * @param {string} data.phonetic_symbol 音标
 * @param {string} data.mean 翻译
 * @description 在卡片上更新单词
 */
async function updateWord(data){
    //显示单词和音标
    let word_element = document.querySelector(".word");
    let symbol_element = document.querySelector(".phonetic_symbol");
    let mean_element = document.querySelector(".mean");
    word_element.textContent = data.word;
    symbol_element.textContent = data.phonetic_symbol;
    mean_element.style.opacity = 0;
    await sleep(CONFIG.wordTime*1000);
    //显示翻译
    let meanArray = data.mean.replaceAll(" ","").match(/[a-z]+\..+?(?=[a-z]+\.|$)/g);
    for(key in meanArray){
        mean_element.style.opacity = 0;
        await sleep(300);
        let currentMean = meanArray[key];
        mean_element.textContent = currentMean;
        mean_element.style.opacity = 1;
        await sleep(CONFIG.translateTime*1000);
    }
    loadWord();
}

/**
 * @description 随机加载一个单词，并在卡片上显示
 */
function loadWord(){
    let random = getRandomNumber(0,AllWords.length);
    let word = AllWords[random];
    updateWord(word);
}

/**
 * @description 加载配置
 */
async function loadConfig(){
    CONFIG={
        wordTime:localStorage.getItem("wordTime")??5,
        translateTime:localStorage.getItem("translateTime")??2,
        autoHide:localStorage.getItem("autoHide")??true,
        scale:localStorage.getItem("scale")??1,
        autoStart:localStorage.getItem("autoStart")??false,
        wordsLevel:localStorage.getItem("wordsLevel")??"四级"
    }
    console.log(CONFIG);
    
    if(!Object.keys(CONFIG).length){
        await Niva.api.dialog.showMessage("错误","无法加载配置数据","error");
        Niva.api.process.exit();
        return;
    }
}

/**
 * @description 主函数
 */
async function main(){
    loadConfig();
    //当没有托盘图标时创建
    let trayList = await Niva.api.tray.list();
    trayList.length||Niva.api.tray.create({
        icon:"assets/logo.png",
        title:"myWords",
        tooltip:"myWords",
        menu:[
            {
                type: "item",
                id: TRAY_EVENT.settings,
                label: "Settings",
                enabled:true,
                selected:false
            },
            {
                type: "native",
                label: "quit"
            }
        ]
    });
    //设置窗口大小和位置
    updateWindowsProperties();
    let vocabularyFile = CONFIG.wordsLevel=="四级"?"vocabulary_CET4":"vocabulary_CET6";
    console.log(vocabularyFile);
    
    AllWords=await getWords(vocabularyFile);
    loadWord();
}

async function updateWindowsProperties(){
    let width = 280;
    let height = 130;
    let scale = CONFIG.scale;
    width*=scale;
    height*=scale;
    document.body.style.zoom = scale;
    let monitor = await Niva.api.monitor.current();
    Niva.api.window.setOuterPosition({x:(monitor.size.width-width)/2,y:0});
    Niva.api.window.setInnerSize({width,height});
    Niva.api.window.setVisible(true);
}