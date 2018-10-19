"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const express = require("express");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const storage_1 = require("./storage");
const pi_camera_connect_1 = require("pi-camera-connect");
let app = express();
// Default settings
const settings = {
    interval: 10 * 1000,
    imagePath: path.join(__dirname, "images")
};
let storageEngine = null;
function getStorageEngine() {
    return __awaiter(this, void 0, void 0, function* () {
        if (storageEngine)
            return storageEngine;
        storageEngine = new storage_1.S3StorageEngine(Object.assign({ uploadDirectory: "" }, yield Promise.resolve().then(() => require("./s3.json"))));
        return storageEngine;
    });
}
function getName() {
    let interfaces = os.networkInterfaces();
    if (interfaces.wlan0) {
        return interfaces.wlan0[0].mac;
    }
    else if (interfaces.eth0) {
        return interfaces.eth0[0].mac;
    }
    else {
        return "NO_MAC:" + crypto.randomBytes(6).toString("hex");
    }
}
const camera = new pi_camera_connect_1.StillCamera();
function takePhoto() {
    return __awaiter(this, void 0, void 0, function* () {
        const image = yield camera.takeImage();
        const imagePath = path.join(os.tmpdir(), crypto.randomBytes(16).toString("hex") + ".jpg");
        yield fs.promises.writeFile(imagePath, image);
        (yield getStorageEngine()).saveFile(imagePath, `${getName()}/${Date.now()}.jpg`);
        yield fs.promises.unlink(imagePath);
    });
}
setInterval(takePhoto, settings.interval);
