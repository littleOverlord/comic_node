'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const path = require('path');

const { ipcRenderer, dialog } = require('electron');

const { removeAll,readFileTryCatch, createHash } = require('./ni/util');

/****************** 本地 ******************/
let url;
let webview, loaded = false, timmer;
const createNode = (u) => {
    if(webview){
        document.body.removeChild(webview);
    }
    webview = document.createElement("webview")
    webview.setAttribute("preload","./img.js");
    webview.setAttribute("src",u);
    webview.setAttribute("style","position:absolute;left:0;top:0;width:100%;height:100%;");
    webview.addEventListener("ipc-message",imgFound);
    // webview.addEventListener("dom-ready",()=>{
    //     webview.openDevTools();
    // })
    document.body.appendChild(webview);
},
runTimer = () => {
    timmer = setTimeout(()=>{
        runTimer();
    },20000);
    // setTimeout(()=>{
        createNode(url);
    // },5000)
    
},
imgFound = (event) => {
    let arg = event.channel;
    console.log("end:: ",arg[0]);
    if(url != arg[0] || loaded){
        return;
    }
    
    if(timmer){
        clearTimeout(timmer);
        timmer = null;
    }
    loaded = true;
    // ipcRenderer.sendSync("request",arg[1]);
    ipcRenderer.send('asynMessage',arg[1]);
};
/****************** 立即执行 ******************/
ipcRenderer.send('asynMessage');
ipcRenderer.on("nextPage",(event, arg) => {
    loaded = false;
    
    if(typeof arg == "string"){
        url = arg;
    }else{
        url = url.replace(/\d+\.html/,`${arg}.html`);
    }
    console.log("start:: ",url);
    runTimer();
})
