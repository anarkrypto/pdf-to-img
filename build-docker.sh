#!/bin/bash

DOCKER_IMAGE="anarkrypto/pdf-to-img:latest"

printf "\n> \e[93m\033[1mBuilding Docker image\e[0m\n\n"
printf "# Image: \e[1;37m${DOCKER_IMAGE}\e[0m\n\n"

docker build -t $DOCKER_IMAGE .