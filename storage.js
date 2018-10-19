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
const path = require("path");
const AWS = require("aws-sdk");
class DiskStorageEngine {
    constructor(options) {
        // Values copied via spread operator instead of being passed by reference
        this.options = Object.assign({}, options);
        this.options.uploadDirectory = path.resolve(__dirname, "../", this.options.uploadDirectory);
        if (!fs.existsSync(this.options.uploadDirectory)) {
            fs.mkdirSync(this.options.uploadDirectory);
        }
        this.uploadRoot = this.options.uploadDirectory;
    }
    saveFile(currentPath, name) {
        return new Promise((resolve, reject) => {
            // Apparently fs.rename() won't move across filesystems so we'll copy and delete instead
            // Error: EXDEV: cross-device link not permitted
            let readStream = fs.createReadStream(currentPath);
            let writeStream = fs.createWriteStream(path.join(this.options.uploadDirectory, name));
            readStream.on("error", reject);
            writeStream.on("error", reject);
            writeStream.on("close", () => {
                fs.unlink(currentPath, err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
            readStream.pipe(writeStream);
        });
    }
    readFile(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs.createReadStream(path.join(this.options.uploadDirectory, name));
        });
    }
}
exports.DiskStorageEngine = DiskStorageEngine;
class S3StorageEngine {
    constructor(options) {
        // Values copied via spread operator instead of being passed by reference
        this.options = Object.assign({}, options);
        this.uploadRoot = this.options.uploadDirectory;
    }
    saveFile(currentPath, name) {
        AWS.config.update({
            region: this.options.region,
            credentials: new AWS.Credentials({
                accessKeyId: this.options.accessKey,
                secretAccessKey: this.options.secretKey
            })
        });
        let s3 = new AWS.S3();
        return new Promise((resolve, reject) => {
            let readStream = fs.createReadStream(currentPath);
            readStream.on("error", reject);
            s3.putObject({
                Body: readStream,
                Bucket: this.options.bucket,
                Key: name
            }).promise().then((output) => {
                resolve();
            }).catch(reject);
        });
    }
    readFile(name) {
        return __awaiter(this, void 0, void 0, function* () {
            AWS.config.update({
                region: this.options.region,
                credentials: new AWS.Credentials({
                    accessKeyId: this.options.accessKey,
                    secretAccessKey: this.options.secretKey
                })
            });
            let s3 = new AWS.S3();
            const object = {
                Bucket: this.options.bucket,
                Key: name
            };
            // Will throw if the object does not exist
            yield s3.headObject(object).promise();
            return s3.getObject(object).createReadStream();
        });
    }
}
exports.S3StorageEngine = S3StorageEngine;
