'use strict';
const fs = require('fs');
const path = require('path');

const { ipcRenderer } = require('electron');



/****************** 本地 ******************/


/****************** 立即执行 ******************/

//选择新项目
window.start = () => {
  // disk.selectObjectDir();
  ipcRenderer.send("request",'openDir');
}
