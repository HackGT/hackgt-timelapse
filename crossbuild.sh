#!/bin/sh

export MMAL_INCLUDE_DIR=/home/petschekr/software/hackgt-timelapse/hackgt-timelapse/mmal/include
export MMAL_LIB_DIR=/home/petschekr/software/hackgt-timelapse/hackgt-timelapse/mmal/lib

source credentials.sh
cargo build --target arm-unknown-linux-gnueabihf --features vendored --release
