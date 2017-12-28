#!/usr/bin/env bash

set -e

wget https://github.com/hyperhq/hypercli/releases/download/v1.10.12/hyper-linux-x86_64.tar.gz
tar -xzf hyper-linux-x86_64.tar.gz
./hyper config --accesskey $HYPER_ACCESS --secretkey $HYPER_SECRET tcp://us-west-1.hyper.sh:443
./hyper login -e $DOCKER_EMAIL -u $DOCKER_USER -p $DOCKER_PASS

docker build -t abhishiv/yarn-resolver .
docker push abhishiv/yarn-resolver
./hyper pull abhishiv/yarn-resolver
./hyper rmi $(./hyper images -f "dangling=true" -q)
./hyper func rm yarn-resolver
./hyper func create --name yarn-resolver --size s4 --timeout=60 abhishiv/yarn-resolver
