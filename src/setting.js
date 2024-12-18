//window.Niva&&Niva.api.webview.openDevtools();
Icons={
    "General":`<svg t="1734253075289" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9740" width="200" height="200"><path d="M0 0m227.577854 0l568.844292 0q227.577854 0 227.577854 227.577854l0 568.844292q0 227.577854-227.577854 227.577854l-568.844292 0q-227.577854 0-227.577854-227.577854l0-568.844292q0-227.577854 227.577854-227.577854Z" fill="#1BB2B2" p-id="9741"></path><path d="M594.030377 315.277609l88.301813-88.20147a220.754532 220.754532 0 0 0-237.91318 46.559138A214.733954 214.733954 0 0 0 395.351298 501.714846L199.180794 697.985693a86.696325 86.696325 0 0 0 122.619108 122.619109l132.452719-132.653406 63.717786-63.717785a217.944929 217.944929 0 0 0 230.788829-48.967369L594.030377 420.838413z m-331.131798 485.559628a44.150906 44.150906 0 1 1 44.150907-44.150907 44.050563 44.050563 0 0 1-44.150907 44.25125z" fill="#FFFFFF" p-id="9742"></path><path d="M792.709456 337.353062l-100.342969 100.342969 90.308672 90.308673a211.322293 211.322293 0 0 0 10.034297-190.651642z" fill="#FFFFFF" p-id="9743"></path></svg>`,
    "About":`<svg t="1734254139486" class="icon" viewBox="0 0 1026 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15959" width="200" height="200"><path d="M505.448517 0.043084a511.978458 511.978458 0 1 0 518.441019 502.643647A511.978458 511.978458 0 0 0 505.448517 0.043084z m56.726926 170.180778a58.881113 58.881113 0 0 1 67.497861 67.497861 86.167482 86.167482 0 0 1-89.039732 80.422983c-49.546302 0-71.806235-25.132182-71.806235-67.497861A87.603607 87.603607 0 0 1 562.893505 170.223862z m-134.995722 660.617365c-35.903118 0-61.753362-21.541871-36.62118-116.326101L433.642282 546.488535c6.462561-27.286369 7.898686-38.057305 0-38.057305a270.709507 270.709507 0 0 0-84.013296 37.339242l-17.233496-28.722494a473.203091 473.203091 0 0 1 229.779953-114.889976c35.903118 0 40.929554 41.647617 23.696058 106.99129l-46.674053 176.643339c-7.898686 30.876681-5.026436 41.647617 0 41.647617a183.823963 183.823963 0 0 0 79.704921-40.211492l20.105746 27.28637A371.238237 371.238237 0 0 1 433.642282 830.841227z" fill="#FC6E6E" p-id="15960"></path></svg>`,

};
Functions={
    Test:function(){
        console.log("test");
    },
    RecoverDefault:function(){
        for(let key in SettingsOptions){
            for(let item of SettingsOptions[key].items){
                if(item.localStorage){
                    localStorage.setItem(item.localStorage,item.defaultValue);
                }
            }
        }
        Settings.init();
        Functions.ReloadCard();
        Functions.SetAutoStart();
        window.Niva&&window.Niva.api.dialog.showMessage("myWords","恢复出厂设置成功");
    },
    OpenGithubLink:function(){
        let url = "https://github.com/heyManNice/myWords";
        if(window.Niva){
            Niva.api.process.open(url);
        }else{
            window.open(url);
        }
    },
    ReLoadConfigDebounce:debounce(async function(){
        if(window.Niva){
            let windowsList = await Niva.api.window.list();
            let index = windowsList.findIndex((item)=>{
                return item.title==="myWords";
            });
            if(index==-1){
                return;
            }
            windowId = windowsList[index].id;
            Niva.api.window.sendMessage("reloadConfig",windowId);
        }
    },500),
    ReloadCard:async function(){
        if(window.Niva){
            let windowsList = await Niva.api.window.list();
            let index = windowsList.findIndex((item)=>{
                return item.title==="myWords";
            });
            if(index==-1){
                return;
            }
            windowId = windowsList[index].id;
            Niva.api.window.sendMessage("reloadCard",windowId);
        }
    },
    SetAutoStart:async function(){
        let isAutoStart = localStorage.getItem("autoStart")=="true";
        let userFolder = (await Niva.api.process.env()).USERPROFILE;
        let userStartUpDir = `${userFolder}\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup`;
        try{
            await Niva.api.fs.readDir(userStartUpDir);
        }catch(e){
            Niva.api.dialog.showMessage("错误","设置失败，找不到用户启动目录","error");
            return;
        }
        let currentExe = await Niva.api.process.currentExe();
        let startUpFile = `${userStartUpDir}\\myWordsStartUp.vbs`;
        if(isAutoStart){
            //启用开机自启动
            if(await Niva.api.fs.exists(startUpFile)){
                //如果已经存在就不创建了
                return;
            }
            let vbsContent = 
`
Set WshShell = WScript.CreateObject("WScript.Shell")
ProgramPath = "${currentExe}"
On Error Resume Next
WshShell.Run ProgramPath, 1, False
If Err.Number <> 0 Then
    '如果启动失败，就删除自身
    SelfDeleteScript = "cmd /c del """ & WScript.ScriptFullName & """"
    WshShell.Run SelfDeleteScript, 0, False
End If
On Error GoTo 0
Set WshShell = Nothing
`;
            Niva.api.fs.write(startUpFile,vbsContent);
        }else{
            //禁用开机自启动
            let isExist = await Niva.api.fs.exists(startUpFile);
            isExist&&Niva.api.fs.remove(startUpFile);
        }
    },
}
SettingsOptions={
    "通用设置":{
        icon:"General",
        items:[
            {
                title:"词汇级别",
                subtitle:"有四级(4428词)和六级(5523词)可选",
                type:"select",
                localStorage:"wordsLevel",
                function:"ReloadCard",
                defaultValue:"四级",
                options:["四级","六级"]
            },
            {
                title:"单词显示时间",
                subtitle:"显示单词（不显示翻译）的持续时间（秒）",
                type:"number",
                localStorage:"wordTime",
                function:"ReLoadConfigDebounce",
                defaultValue:5,
                range:[1,10]
            },
            {
                title:"每个翻译显示时间",
                subtitle:"显示翻译的持续时间（秒）",
                type:"number",
                localStorage:"translateTime",
                function:"ReLoadConfigDebounce",
                defaultValue:2,
                range:[1,10]
            },
            {
                title:"自动隐藏窗口",
                subtitle:"当鼠标移动到卡片窗口上时自动隐藏窗口",
                type:"switch",
                function:"ReLoadConfigDebounce",
                localStorage:"autoHide",
                defaultValue:"true",
            },{
                title:"单词卡片缩放",
                subtitle:"单词卡片尺寸缩放值",
                type:"decimal",
                localStorage:"scale",
                function:"ReloadCard",
                defaultValue:1,
                range:[0.5,3]
            },
            {
                title:"开机自启动",
                subtitle:"是否在开机时自动启动该软件",
                type:"switch",
                localStorage:"autoStart",
                function:"SetAutoStart",
                defaultValue:"false",
            },
            {
                title:"恢复默认设置",
                subtitle:"将所有设置恢复为默认设置",
                type:"button",
                function:"RecoverDefault",
                defaultValue:"恢复默认设置",
            }
        ]
    },
    "关于":{
        icon:"About",
        items:[
            {
                title:"Github",
                subtitle:"github.com/heyManNice/myWords",
                type:"button",
                function:"OpenGithubLink",
                defaultValue:"打开链接",
            }
        ]
    }
};



Settings={
    renderOptions:function(){
        let option_element = document.querySelector("container .option");
        let htmlStr = "<ul>";
        let order = 1;
        for(key in SettingsOptions){
            let optionIcon = Icons[SettingsOptions[key].icon];
            htmlStr+=`<li data-order=${order++} onclick = "Settings.renderDetail(this)"><span class="bar"></span>${optionIcon}<span>${key}</span></li>`;
        }
        htmlStr+="</ul>";
        option_element.innerHTML = htmlStr;
    },
    renderDetail:function(element){
        //处理鼠标点击设置选项时的动画
        let checked_element = document.querySelector(`container .option ul li[class~="checked"]`);
        if(checked_element){
            let checked_order = checked_element.getAttribute("data-order");
            let new_order = element.getAttribute("data-order");
            if(checked_order == new_order){
                return;
            }
            //处理动画逻辑
            let checked_bar_element = checked_element.querySelector("span.bar");
            if(checked_order<new_order){
                //bar向下移动
                checked_bar_element.animate([
                    {
                        transform:"translateY(0%)",
                        height:"20px"
                    },
                    {
                        transform:"translateY(100%)",
                        height:"30px"
                    }
                ],{
                    duration:300,
                    easing:"cubic-bezier(1, 0.5, 0.5, 0)"
                });

                setTimeout(function(){
                    element.classList.add("checked");
                    element.querySelector("span.bar").animate([
                        {
                            transform:"translateY(-100%)",
                            height:"30px"
                        },
                        {
                            transform:"translateY(0%)",
                            height:"20px"
                        }
                    ],{
                        duration:300,
                        easing:"cubic-bezier(0, 0.5, 0.5, 1)"
                    });
                },200);
            }else{
                //bar向上移动
                checked_bar_element.animate([
                    {
                        transform:"translateY(0%)",
                        height:"20px"
                    },
                    {
                        transform:"translateY(-100%)",
                        height:"30px"
                    }
                ],{
                    duration:300,
                    easing:"cubic-bezier(1, 0.5, 0.5, 0)"
                });
                setTimeout(function(){
                    element.classList.add("checked");
                    element.querySelector("span.bar").animate([
                        {
                            transform:"translateY(100%)",
                            height:"30px"
                        },
                        {
                            transform:"translateY(0%)",
                            height:"20px"
                        }
                    ],{
                        duration:300,
                        easing:"cubic-bezier(0, 0.5, 0.5, 1)"
                    });
                },200);
            }
            setTimeout(function(){
                checked_element.classList.remove("checked");
            },300);
        }else{
            element.classList.add("checked");
        }
        //开始拼接详细设置的html字符串
        let detail_element = document.querySelector("container .detail");
        let htmlStr = "<ul>";
        for(key in SettingsOptions){
            if(key == element.innerText){
                for(let i = 0;i<SettingsOptions[key].items.length;i++){
                    let item = SettingsOptions[key].items[i];
                    let value = item.localStorage?localStorage.getItem(item.localStorage):item.defaultValue;
                    
                    value == null && (value = item.defaultValue);
                    let onchangeStr = "";
                    if(item.localStorage){
                        onchangeStr+=`localStorage.setItem('${item.localStorage}',this.value);`;
                    }
                    if(item.function){
                        onchangeStr+=`Functions.${item.function}();`;
                    }
                    let controlStr = "";
                    //针对不同的类型进行添加不同的控件
                    switch(item.type){
                        case "switch":
                            onchangeStr = onchangeStr.replace("this.value",`this.checked`);
                            controlStr = `<input onchange="${onchangeStr}" ${value=="true"?"checked":""} type="checkbox">`;
                            break;
                        case "number":
                            controlStr = `<input min="${item.range[0]}" max="${item.range[1]}" onchange="${onchangeStr}" value="${value}" type="number">`;
                            break;
                        case "decimal":
                            controlStr = `<input min="${item.range[0]}" max="${item.range[1]}" step="0.1" onchange="${onchangeStr}" value="${value}" type="number">`;
                            break;
                        case "button":
                            controlStr = `<input onclick="${onchangeStr}" value="${value}" type="button">`;
                            break;
                        case "select":
                            let options = item.options.map((option)=>{
                                return `<option ${option==value?"selected":""}>${option}</option>`;
                            });
                            controlStr = `<select onchange="${onchangeStr}">${options.join("")}</select>`;
                            break;
                        case "text":
                            controlStr = ` `;
                            break;
                    }

                    htmlStr+=`<li><div class="introduce"><span class="title">${item.title}</span><br><span class="subtitle">${item.subtitle}</span></div><div class="control">${controlStr}</div></li>`;
                }
            }
        }
        htmlStr+="</ul>";
        detail_element.innerHTML = htmlStr;

        //详细设置界面执行动画
        detail_element.animate([
            {transform:"translateY(70%)"},
            {transform:"translateY(0%)"}
        ],{
            duration:300,
            easing:"cubic-bezier(0.000, 0.870, 0.025, 1.000)"
        });
    },
    init:function(){
        Settings.renderOptions();
        let firstOption = document.querySelector("container .option ul li");
        firstOption && firstOption.onclick();
    }
}

Settings.init();

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
};