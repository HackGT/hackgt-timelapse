import * as fs from "fs";
import * as express from "express";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { S3StorageEngine} from "./storage";
import { StillCamera } from "pi-camera-connect";

let app = express();

// Default settings
const settings = {
	interval: 10 * 1000,
	imagePath: path.join(__dirname, "images")
};

let storageEngine: S3StorageEngine | null = null;
async function getStorageEngine() {
	if (storageEngine) return storageEngine;
	storageEngine = new S3StorageEngine({
		uploadDirectory: "",
		...await import("./s3.json")
	});
	return storageEngine;
}

function getName(): string {
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

const camera = new StillCamera();
async function takePhoto() {
	const image = await camera.takeImage();
	const imagePath = path.join(os.tmpdir(), crypto.randomBytes(16).toString("hex") + ".jpg");
	await fs.promises.writeFile(imagePath, image);
	(await getStorageEngine()).saveFile(imagePath, `${getName()}/${Date.now()}.jpg`);
	await fs.promises.unlink(imagePath);
}

setInterval(takePhoto, settings.interval);
