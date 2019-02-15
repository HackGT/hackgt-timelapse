use std::fs;
use std::{ thread, time };
use std::time::SystemTime;

use crossbeam_channel::unbounded;
use crossbeam_channel::{ Sender, Receiver };
use pnet::datalink;
use rascam::SimpleCamera;
use s3::bucket::Bucket;
use s3::credentials::Credentials;

fn main() {
    let device_name = get_device_name();
    println!("Upload prefix: {}", device_name);
    if fs::create_dir(&device_name).is_ok() {
        println!("Created upload directory");
    }

    let (tx, rx): (Sender<String>, Receiver<String>) = unbounded();
    const UPLOAD_THREADS: u32 = 4;
    for id in 0..UPLOAD_THREADS {
        let rx = rx.clone();
        thread::spawn(move || {
            let bucket = Bucket::new(
                option_env!("BUCKET_NAME").unwrap_or("hackgt-timelapse"),
                option_env!("REGION").unwrap_or("us-east-1").parse().unwrap(),
                Credentials::new(
                    Some(env!("ACCESS_KEY").to_string()),
                    Some(env!("SECRET_KEY").to_string()),
                    None,
                    None
                )
            );
            loop {
                let filename = rx.recv().unwrap();
                println!("Uploading {} from uploader #{} ({} pending)", filename, id, rx.len());

                let bytes = fs::read(&filename).unwrap();
                if let Err(err) = bucket.put(&filename, &bytes, "image/jpeg") {
                    eprintln!("Error uploading: {:?}", err);
                }
                fs::remove_file(&filename).unwrap();
                println!("Uploader #{} finished", id);
            }
        });
    }

    let info = rascam::info().unwrap();
    if info.cameras.len() < 1 {
        println!("Found 0 cameras. Exiting");
        ::std::process::exit(1);
    }

    let mut camera = SimpleCamera::new(info.cameras[0].clone()).unwrap();
    camera.activate().unwrap();
    // Needed to allow for OS to set up camera
    // Freezes Pi if an image capture is attempted right away
    sleep_millis(2000);

    const WAIT_TIME: u64 = 10; // seconds
    let mut start_time = SystemTime::now();
    loop {
        if start_time.elapsed().unwrap().as_secs() < WAIT_TIME {
            sleep_millis(1000);
            continue;
        }
        start_time = SystemTime::now();

        let bytes = match camera.take_one() {
            Ok(bytes) => bytes,
            Err(err) => {
                eprintln!("Take picture error: {:?}", err);
                continue;
            }
        };

        let filename = format!("{}/{}.jpg", device_name, get_timestamp());
        fs::write(&filename, &bytes).expect("Couldn't write image");
        println!("Captured image");

        // Send filename to uploader thread(s)
        tx.send(filename).unwrap();
    }
}

fn get_device_name() -> String {
    datalink::interfaces()
        .iter()
        .find(|iface| iface.name == "wlan0")
        .and_then(|iface| iface.mac)
        .and_then(|mac| Some(mac.to_string()))
        .unwrap_or(String::from("NO_MAC_ADDRESS"))
}

fn get_timestamp() -> u64 {
    let now = SystemTime::now();
    now.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs()
}

fn sleep_millis(millis: u64) {
    let sleep_duration = time::Duration::from_millis(millis);
    thread::sleep(sleep_duration);
}
