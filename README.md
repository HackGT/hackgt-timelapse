# hackgt-timelapse
### A [fire-and-forget](https://en.wikipedia.org/wiki/Fire-and-forget) system for timelapses on Raspberry Pis

## Configuration
To set the wait time (in seconds) between photo captures, configure the `WAIT_TIME` env var in `crossbuild.sh`

    export WAIT_TIME=10 # seconds

To configure the AWS S3 upload configure the following environment variables in the (`.gitignore`d) `credentials.sh` file:

| Variable      | Description                                  |
| ------------- | -------------------------------------------- |
| `BUCKET_NAME` | S3 bucket name (default: `hackgt-timelapse`) |
| `REGION`      | S3 region (default: `us-east-1`)             |
| `ACCESS_KEY`  | Access key (*no default*)                    |
| `SECRET_KEY`  | Secret key (*no default*)                    |

## Building

**`hackgt-timelapse` is only compatible with Raspberry Pis (any model) with a first-party camera attached.**

While this project can be compiled directly on the Raspberry Pi, it will be *slowww*. Since Rust makes it very easy to cross-compile for other platforms, we'll do that instead.

### Install tools

First off, make sure that [Rust is installed](https://www.rust-lang.org/tools/install). Then follow either of these instructions depending on the device that you're targeting:

#### ARMv7 (e.g. models 2 or 3) as a Rust target (**easier**):
1. Install standard crates: `rustup target add armv7-unknown-linux-gnueabihf`
2. Install compiler toolchain: `sudo apt install gcc-arm-linux-gnueabihf`

#### Add ARMv6 (e.g. Pi Zero or original Pi v1) as a Rust target (**harder**):
1. Install standard crates: `rustup target add arm-unknown-linux-gnueabihf`
2. **NB**: the toolchain installed by `sudo apt install gcc-arm-linux-gnueabihf` (despite the name) is *not* compatible with ARMv6. If you have it installed, you must uninstall it before proceeding.
3. Clone the [Raspberry Pi Tools repository](https://github.com/raspberrypi/tools)
4. Add the toolchain to your path (in your `.bashrc`)

		# Add linker with support for ARMv6
		export PATH=/path/to/rpi-tools/arm-bcm2708/arm-linux-gnueabihf/bin:$PATH
		export PATH=/path/to/rpi-tools/arm-bcm2708/arm-linux-gnueabihf/libexec/gcc/arm-linux-gnueabihf/4.9.3:$PATH

### Actually compiling

1. Make sure to set your configuration.
2. Change `BUILD_DIR` in `crossbuild.sh` to point to the root of this project's directory. This is used for finding the `mmal` headers during cross-compilation.
2. Run `./crossbuild.sh --release` to build a self-contained binary that you can ship directly on your Raspberry Pi
3. Builds will appear in `target/arm-unknown-linux-gnueabihf/release` as `hackgt-timelapse`

## Running

Before you start, make sure that you've set up your Pi correctly by running `raspi-config`:
* Enable the camera
* Configure network access (e.g. Wi-Fi)
* Ensure that wait for network at boot is enabled

Since configuration is baked into the build, `./hackgt-timelapse` will start capturing timelapse images and uploading to S3. Each timelapse instance will upload images to a folder named after its `wlan0` MAC address to make multi-camera setups a breeze.
