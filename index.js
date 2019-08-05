'use strict';
const fs = require('fs');
const path = require('path');
const http = require("http");
const { app, BrowserWindow,BrowserView, dialog, ipcMain } = require('electron');

const log = require("./src/ni/log");
/****************** 本地 ******************/

// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let wins = [],senders = [];
let lastDir,
  comicList = [],
  task = [],
  nowComic,
  imgWait = [],
  imgTable = {
    name: null,
    count: 0
  };
class Comic{
  constructor(dir,name){
    this.dir = dir;
    this.name = name;
    this.cfg = JSON.parse(fs.readFileSync(path.join(dir,name,"info.json"),"utf8"))
    // this.cfg = require(path.join(dir,name,"info.json"))
  }
}
class Volume{
  constructor(path,url){
    this.path = path;
    this.url = url;
    this.curr = 0;
    this.total = 0;
  }
}
//打开新窗口
const createWindow = (index,dir) => {
  
  // 创建浏览器窗口。
  const win = new BrowserWindow({ width: 800, height: 600 , id: dir?"child":"main"})

  // 然后加载应用的 index.html。
  win.loadFile(index)

  // 打开开发者工具
  win.webContents.openDevTools()
  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    wins.splice(wins.indexOf(win),1);
    // console.log("wins.length = ",wins.length);
    if(wins.length == 1){
      // wins[0].show();
      // wins[0].reload();
    }
  })
  wins.push(win);
}

const openSingle = () => {
  const win = new BrowserWindow({ width: 800, height: 600 , id:"child"})
  win.loadFile("./src/child.html");
  // 打开开发者工具
  win.webContents.openDevTools()
}
const readDir = (file) =>{
  log.init(file);
  
  let list = fs.readdirSync(file);
  console.log("comic number :: ",list.length);
  let s = "",rs = "";
  for(let i = list.length-1 ; i >= 0 ;i--){
    let c;
    try{
      c = new Comic(file,list[i]);
      if(!c.cfg.loaded){
        comicList.push(c);
      }
      // else{
      //   // console.log(c.cfg.title," loaded")
      //   s += `xcopy '${path.resolve(file,c.cfg.title)}' '${path.resolve(file.replace("res",""),"loaded",c.cfg.title)}' /s /e /y \n`;
      //   rs += `rd /s/q '${path.resolve(file,c.cfg.title)}' \n`;
      // }
    }catch(e){
      // console.log(e);
      log.add(`${list[i]}`,"info")
    }
  }
  // s += "pause"
  // rs += "pause"
  // fs.writeFileSync(path.resolve(file.replace("res",""),"copy.bat"),s);
  // fs.writeFileSync(path.resolve(file.replace("res",""),"remove.bat"),rs);
  // console.log(comicList);
  collect()
  openSingle();
}
/**
 * @description 解析漫画任务
 */
const collect = () => {
  nowComic = comicList.shift();
  console.log(nowComic.cfg.title);
  for(let k in nowComic.cfg.list){
    task.push(new Volume(k,'http://www.huhudm.com'+nowComic.cfg.list[k]))
    // openSingle('http://www.huhudm.com'+nowComic.cfg.list[k])
    // break;
  }
  if(senders.length > 0){
    runTask();
  }
  
}
/**
 * @description 执行图片查找任务
 */
const runTask = () => {
  // console.log(senders.length,task[0].url);
  if(task.length == 0){
    collect();
    return;
  }
  // console.log("nextPage",task[0].url,senders.length);
  runSenders("nextPage",task[0].url);
}
/**
 * @description 添加图片下载任务
 * @param {*} _url 
 * @param {*} index 
 */
const addImg = (_url,index) => {
  let ext = path.extname(_url), 
  _path = path.resolve(lastDir,task[0].path,`${index}${ext}`);
  // imgWait.push([_url,_path]);
  writeImgTable(`["${_url}","${_path}"]`);
  return;
  if(imgWait.length == 1){
    runWriteImg();
  }
}
/**
 * @description 执行图片下载任务
 */
const runWriteImg = () => {
  let w = imgWait.shift();
  if(w){
    writeImg(w[0],w[1]);
  }
}
/**
 * @description 下载图片
 * @param {*} _url 
 * @param {*} _path 
 */
const writeImg = (_url,_path)=>{
  let wimg = (p,data) =>{
      // if(count1 == 0||data.length == 0){
      //   runWriteImg();
      //   log.add(`[${_url},${_path}]`,"imgload");
      //   return;
      // }
      fs.writeFile(p,data,'binary',function(err){  //_url为本地路径例如public/logo.png
        if(err){
          imgWait.push([_url,p]);
        }
        // else{
          // console.log('save ok :: ',_path);
          runWriteImg();
        // }
      })
    },
    wt = (u,p) => {
      let tm;
      let req = http.get(u,function(res){  //_url为网络图片地址
        var imgData = '';
        const { statusCode } = res;
        if (statusCode !== 200) {
          clearTimeout(tm);
          res.resume();
          imgWait.push([_url,_path]);
          runWriteImg();
          console.log("statusCode :: ",statusCode,_url,_path)
          return;
        }
        res.setEncoding('binary');
        res.on('data',function(chunk){
          clearTimeout(tm);
          imgData += chunk
        })
        res.on('end',function(){
          clearTimeout(tm);
          wimg(p,imgData)
        })
        res.on("error",function(err){
          clearTimeout(tm);
          imgWait.push([_url,_path]);
          console.log("loadImg error res::",_url,_path);
        })
      });
      req.on("error",()=>{
        clearTimeout(tm);
        imgWait.push([_url,_path]);
        console.log("loadImg error req::",_url,_path);
      })
      tm = setTimeout(()=>{
        req.abort();
        // imgWait.push([_url,_path]);
        console.log("loadImg error timeout::",_url,_path);
      },30000)
    }; 
  wt(_url,_path);
}
/**
 * @description 标记已下载
 */
const markLoaded = () => {
  let p = path.join(nowComic.dir,nowComic.name,"info.json"),cfg = require(p);
  cfg.loaded = 1;
  fs.writeFileSync(p,JSON.stringify(cfg));
}
/**
 * @description 响应渲染线程事件
 */
const responseRequest = {
  openDir: (event,arg) => {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }, function (files) {
        if(files){
          if(!arg.length){
            lastDir = files[0];
            readDir(lastDir);
            lastDir = lastDir.replace("res","");
            // createWindows(lastDir);
            // console.log(files);
          }else{
            event.sender.send('selectDirectory', files);
          }
        }
    })
  },
  singlePage: (event,arg) => {
    if(arg.length){
      if(arg[2] == "0"){
        task[0].curr += 1;
        log.add(`[${task[0].path},${task[0].url},${task[0].curr}]`,"task")
      }else{
        task[0].curr = arg[0]-0;
        task[0].total = arg[1]-0;
        addImg(arg.pop(),arg[0]);
      }
      if(task[0].curr == task[0].total){
        task.shift();
        if(task.length == 0){
          markLoaded();
          collect();
        }else{
          runTask();
        }
        return;
      }
      runSenders("nextPage",task[0].curr+1);
      // console.log("nextPage",task[0].curr+1);
    }
  }
}
const addSender = (event) => {
  let isfirst = senders[0];
  senders[0] = event;
  return isfirst;
}
const runSenders = (key,message) => {
  for(let i = 0, len = senders.length; i < len; i++){
    senders[i].sender.send(key, message);
  }
}
/**
 * @description 记录图片下载路径
 */
const writeImgTable = (s) => {
  if(!imgTable.name){
    imgTable.name = `imgurl-${Date.now()}.text`;
  }
  imgTable.count += 1;
  if(imgTable.count == 1){
    s = "["+s;
  }
  if(imgTable.count < 5000){
    s = s+","
  }
  if(imgTable.count == 5000){
    s = s + "]";
  }
  fs.appendFile(path.resolve(lastDir,"loaded",imgTable.name),s,(err)=>{
    err && console.log("writeImgTable error :: ",err);
  });
  if(imgTable.count == 5000){
    imgTable.count = 0;
    imgTable.name = null;
  }
}
/****************** 立即执行 ******************/
// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', function(){
  createWindow("index.html");
  
})

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (wins.length === 0) {
    createWindow("./index.html")
  }
})
//监听渲染进程打开新文件夹的消息
ipcMain.on('request', (event, arg) => {
  // console.log(arg) // prints "ping"
  let args = arg.split("&");
  // console.log(args);
  responseRequest[args.shift()](event,args);
})
ipcMain.on('asynMessage', (event, arg) => {
  addSender(event);
  if(arg){
    let args = arg.split("&");
    // console.log(args);
    responseRequest[args.shift()](event,args);
  }else{
    setTimeout(()=>{
      // if(task.length > 0){
        runTask();
      // }
    },0)
  }
})
process.on('uncaughtException', (err) => {
  console.log(err.message);
  // add("error",err);
});