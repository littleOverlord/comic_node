'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const path = require('path');

const { ipcRenderer, dialog } = require('electron');

const { removeAll,readFileTryCatch, createHash } = require('./ni/util');
const log = require("./ni/log");

/****************** 本地 ******************/
const load = () =>{
    let img = document.querySelector("#iBody img");
    if(!img || !img.getAttribute("src")){
        setTimeout(() => {
            load();
        }, 500);
        return;
    }
    let hdPageIndex = document.querySelector("#hdPageIndex");
    let hdPageCount = document.querySelector("#hdPageCount");
    
    ipcRenderer.sendToHost([location.href,`singlePage&${hdPageIndex.getAttribute("value")}&${hdPageCount.getAttribute("value")}&${img.getAttribute("src")}`])
    // ipcRenderer.sendSync("request",`singlePage&${hdPageIndex.getAttribute("value")}&${hdPageCount.getAttribute("value")}&${img.getAttribute("src")}`);
}
load();
// window.onload = () => {
//     if(timmer){
//         clearTimeout(timmer);
//     }
//     load();
//     if(!loaded){
//         clearTimeout(timmer);
//         ipcRenderer.sendSync("request",`singlePage&0&0&0`);
//     }
// }
// window.onload = () => {
//     console.log(location.href);
// }
// setTimeout(() => {
//     location.href = "https://www.baidu.com";
// }, 5000);

/****************** 立即执行 ******************/
