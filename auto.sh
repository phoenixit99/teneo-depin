#!/bin/bash
echo "                                                                    "
echo "                                                                    "
echo "                                                                    "
echo "                                                                    "
echo "  H   H  EEEEE  N   N  RRRR   Y    Y     N   N  OOO   DDDD   EEEEE  "
echo "  H   H  E      NN  N  R   R    Y Y      NN  N O   O  D   D  E      "
echo "  HHHHH  EEEE   N N N  RRRR      Y       N N N O   O  D   D  EEEE   "
echo "  H   H  E      N  NN  R  R      Y       N  NN O   O  D   D  E      "
echo "  H   H  EEEEE  N   N  R   R     Y       N   N  OOO   DDDD   EEEEE  "
echo "                                                                    "
echo "                                                                    "
echo "                                                                    "
echo "                                                                                                                        "
echo "                                                                                                                        "
echo "                                                                                                                        "
echo "                                                                                                                        "
echo ""
echo "                                                                                                                        "
echo "                                                                                                                        "
echo "                                                                                                                        "
echo "                                                                                                                        "
sleep 3
set -e  # Exit script on error
# Detele t3rnd service
# sudo systemctl stop teneo &&  rm -rf /etc/systemd/system/teneo.service && sudo systemctl daemon-reload
rm -rf $HOME/teneo-depin
# Setup directory and clean up any previous run
cd $HOME

if [ -d "teneo" ]; then
    echo "Directory 'teneo' exists. Removing it..."
    rm -rf teneo-depin
fi
# Create and navigate to t3rn directory

 echo "--- Enable ssh via firebase ----"

ufw allow ssh
ufw enable
ufw status

git clone https://github.com/phoenixit99/teneo-depin.git

cd teneo-depin

npm install


sudo tee /etc/systemd/system/teneo.service > /dev/null <<EOF

[Unit]
Description=Executor teneo
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$HOME/teneo-depin
ExecStart=/usr/bin/node main.js --prefix $HOME/teneo-depin
Restart=always
RestartSec=3
Environment="NODE_ENV=testnet"


[Install]                     
WantedBy=multi-user.target   
EOF

node main.js

# sudo systemctl daemon-reload
# sudo systemctl enable teneo
# sudo systemctl restart teneo
# sudo journalctl -u teneo -f -o cat

# sleep 5
