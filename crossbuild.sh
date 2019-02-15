#!/bin/bash

BUILD_DIR=/home/petschekr/software/hackgt-timelapse
# Set directories for cross-compiling with mmal headers (sourced directly from a Raspberry Pi Zero)
export MMAL_INCLUDE_DIR=${BUILD_DIR}/mmal/include
export MMAL_LIB_DIR=${BUILD_DIR}/mmal/lib

source credentials.sh
export WAIT_TIME=10 # seconds

cargo build --target arm-unknown-linux-gnueabihf --features vendored $@
