#!/bin/sh
cd ..
nohup node lib/master.js -m production -n baseService >>bin/app.log &
exit 0
