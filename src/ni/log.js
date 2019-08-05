'use strict';
/****************** 导入 ******************/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
/****************** 导出 ******************/
exports.init = (p) => {
    let projectPath = path.resolve(p,"../../");
    root = path.resolve(projectPath,"back","log");
    console.log(root);
} 
/**
 * @description add log interface
 */
exports.add = (message,type) => {
    add(type||"error",message);
}
/****************** 本地 ******************/
let root;
/**
 * @description error wait table
 */
let wait=[];
let count = {};
/**
 * @description log
 * @param {String}type log type (will be suffix of the log file) : "error","warn","info"...
 * @param {String}title the log message's title
 * @param {String}msg detail of the log
 */
const Log = (type,msg) => {
    return {
        type: type,
        msg: msg
    };
}
/**
 * @description add log
 * @param {string} type log type like : "error"..
 * @param {Error} err 
 */
const add = (type,message) => {
    wait.push(Log(type,message));
    if(wait.length == 1)
        _write(wait[0]);
}
/**
 * @description write next
 */
const writeNext = (err) => {
    wait.shift();
    wait.length && _write(wait[0]);
    if(err)
        throw err;
};
/**
 * @description count the per type message write count
 * @param {*} type 
 */
const caclCount = (type) => {
    if(!count[type]){
        count[type] = 0;
    }
    count[type] += 1;
}
/**
 * @description write log
 */
const _write = (data) => {
    caclCount(data.type);
    let _n = `${root}/${Math.floor(count[data.type]/5000)}.${data.type}`;
    fs.appendFile(_n,`${data.msg},`,writeNext);
}
/****************** 立即执行 ******************/
