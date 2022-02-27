import App from './modular/app';
import Window from './modular/window';
import Global from './modular/general/global';
import Tray from './modular/additional/tray';
import { logOn } from './modular/general/log';
import { pathOn } from './modular/general/path';
import { fileOn, writeFile,fileBySuffix } from './modular/general/file';
import Shortcut from "./modular/enhance/shortcut";
import { customize, opt } from '@/cfg/window.json';

import Session from './modular/general/session';
import Dialog from './modular/additional/dialog';
import Menu from './modular/additional/menu';

import { ipcMain } from 'electron';

import { join } from "path";


App.start().then(async () => {
    // 主要模块
    Global.on();//全局模块
    Window.on();//窗口模块
    Shortcut.on();//快捷键模块
    Tray.on();//托盘模块
    logOn();//日志模块

    // 可选模块
    fileOn();//文件模块
    pathOn();//路径模块



    await App.use([Session, Dialog, Menu]);

    // 窗口
    Window.create(customize, opt);

    ipcMain.handle('get-file-path', (_, args) => fileBySuffix(args.path, args.suf))

    ipcMain.handle('base-seve', (_, args) => {
        const base64 = args.data.replace(/^data:image\/\w+;base64,/, "");
        return writeFile(join(args.path, `${args.id}.jpg`), Buffer.from(base64, 'base64'), { encoding: 'utf-8' });
    })


    // 托盘
    Tray.create();
})