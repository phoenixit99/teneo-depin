const WebSocket = require('ws');
const { promisify } = require('util');
const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const chalk = require('chalk');

let socket = null;
let pingInterval;
let countdownInterval;
let potentialPoints = 0;
let countdown = "Calculating...";
let pointsTotal = 0;
let pointsToday = 0;
let retryDelay = 1000;

const authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getLocalStorage() {
  try {
    const data = await readFileAsync('localStorage.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function setLocalStorage(data) {
  const currentData = await getLocalStorage();
  const newData = { ...currentData, ...data };
  await writeFileAsync('localStorage.json', JSON.stringify(newData));
}

async function connectWebSocket(userId, proxy) {
  if (socket) return;
  console.log("WebSocket ping connection");
  const version = "v0.2";
  const url = "wss://secure.ws.teneo.pro";
  const wsUrl = `${url}/websocket?userId=${encodeURIComponent(userId)}&version=${encodeURIComponent(version)}`;
    console.log("WebSocket disconnected");

  const options = {};
  if (proxy) {
    options.agent = new HttpsProxyAgent(proxy);
  }

  socket = new WebSocket(wsUrl, options);

  socket.onopen = async () => {
    const connectionTime = new Date().toISOString();
    await setLocalStorage({ lastUpdated: connectionTime });
    console.log("WebSocket connected at", connectionTime);
    startPinging();
    startCountdownAndPoints();
  };

  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log("Received message from WebSocket:", data);
    if (data.pointsTotal !== undefined && data.pointsToday !== undefined) {
      const lastUpdated = new Date().toISOString();
      await setLocalStorage({
        lastUpdated: lastUpdated,
        pointsTotal: data.pointsTotal,
        pointsToday: data.pointsToday,
      });
      pointsTotal = data.pointsTotal;
      pointsToday = data.pointsToday;
    }
  };

  socket.onclose = () => {
    socket = null;
    console.log("WebSocket disconnected");
    stopPinging();
    setTimeout(() => connectWebSocket(userId, proxy), retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
    console.error("------- Alo Alo -------");
    console.error("------- There is no problem the tool should auto reconnect -------");
    console.error("------- Please enjoy the tool with a cup of coffee -------");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    console.error("------- Alo Alo -------");
    console.error("------- There is no problem the tool should auto reconnect -------");
    console.error("------- Please enjoy the tool with a cup of coffee -------");
  };
}

function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
    stopPinging();
  }
}

function startPinging() {
  stopPinging();
  pingInterval = setInterval(async () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PING" }));
      await setLocalStorage({ lastPingDate: new Date().toISOString() });
    }
  }, 10000);
}

function stopPinging() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

process.on('SIGINT', () => {
  console.log('Received SIGINT. Stopping pinging...');
  stopPinging();
  disconnectWebSocket();
  process.exit(0);
});

function startCountdownAndPoints() {
  clearInterval(countdownInterval);
  updateCountdownAndPoints();
  countdownInterval = setInterval(updateCountdownAndPoints, 1000);
}

async function updateCountdownAndPoints() {
  const { lastUpdated } = await getLocalStorage();
  if (lastUpdated) {
    const nextHeartbeat = new Date(lastUpdated);
    nextHeartbeat.setMinutes(nextHeartbeat.getMinutes() + 15);
    const now = new Date();
    const diff = nextHeartbeat.getTime() - now.getTime();

    if (diff > 0) {
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      countdown = `${minutes}m ${seconds}s`;

      const maxPoints = 25;
      const timeElapsed = now.getTime() - new Date(lastUpdated).getTime();
      const timeElapsedMinutes = timeElapsed / (60 * 1000);
      let newPoints = Math.min(maxPoints, (timeElapsedMinutes / 15) * maxPoints);
      newPoints = parseFloat(newPoints.toFixed(2));

      if (Math.random() < 0.1) {
        const bonus = Math.random() * 2;
        newPoints = Math.min(maxPoints, newPoints + bonus);
        newPoints = parseFloat(newPoints.toFixed(2));
      }

      potentialPoints = newPoints;
    } else {
      countdown = "Calculating...";
      potentialPoints = 25;
    }
  } else {
    countdown = "Calculating...";
    potentialPoints = 0;
  }

  await setLocalStorage({ potentialPoints, countdown });
}


async function updateReferralCode(userId) {
  const profileUrl = `https://ikknngrgxuxgjhplbpey.supabase.co/rest/v1/profiles?id=eq.${userId}`;
  
  try {
    const response = await axios.patch(profileUrl, {
      invited_by: 'OMjuE'  
    }, {
      headers: {
        'Authorization': authorization,
        'apikey': apikey
      }
    });
  } catch (error) {
    console.error('Error updating referral code:', error.response ? error.response.data : error.message);
  }
}

async function getUserId(proxy) {
  const loginUrl = "https://ikknngrgxuxgjhplbpey.supabase.co/auth/v1/token?grant_type=password";
  
  rl.question('Email: ', (email) => {
    rl.question('Password: ', async (password) => {
      try {
        const response = await axios.post(loginUrl, {
          email: email,
          password: password
        }, {
          headers: {
            'Authorization': authorization,
            'apikey': apikey
          }
        });

        const userId = response.data.user.id;
        console.log('User ID:', userId);

        // await updateReferralCode(userId);

        const profileUrl = `https://ikknngrgxuxgjhplbpey.supabase.co/rest/v1/profiles?select=personal_code&id=eq.${userId}`;
        const profileResponse = await axios.get(profileUrl, {
          headers: {
            'Authorization': authorization,
            'apikey': apikey
          }
        });

        await setLocalStorage({ userId });
        await startCountdownAndPoints();
        await connectWebSocket(userId, proxy);
      } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
      } finally {
        rl.close();
      }
    });
  });
}

async function main() {
  const localStorageData = await getLocalStorage();
  let userId = localStorageData.userId;
  let proxy = null;

    if (!userId) {
      console.log('Please make sure you have account to login and run node.\n');
      console.log('Please login to your account to continue.');
      await getUserId(proxy);
    } else {
      rl.question('You already have account. Please choose an option:\n1. Logout the a\n2. Start Running Node\nChoose an option: ', async (option) => {
        switch (option) {
          case '1':
            fs.unlink('localStorage.json', (err) => {
              if (err) throw err;
            });
            console.log('Logged out successfully.');
            process.exit(0);
            break;
          case '2':
            await startCountdownAndPoints();
            await connectWebSocket(userId, proxy);
            break;
          default:
            console.log('Invalid option. Exiting...');
            process.exit(0);
        }
      });
    }
}

main();