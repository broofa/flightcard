#!/usr/bin/env bash

# Load env vars
source ~/.bash_profile

# CD to script dir
cd $(dirname "$0")
source ../../.envrc

cat > crontab.log << EOF
Date: $(date)
echo Dir: $(pwd)

EOF

# Run in production mode, and save log
./fetch_tra_members.js --production 2>&1 >> crontab.log
