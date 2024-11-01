#!/usr/bin/env bash

# Load env vars
source ~/.bash_profile

# CD to script dir
cd $(dirname "$0")
source ../../.envrc

echo Date: $(date) > crontab.log
echo Dir: $(pwd) >> crontab.log
echo ""

# Run in production mode, and save log
./fetch_tra_members.js --production 2>&1 | tee -a crontab.log