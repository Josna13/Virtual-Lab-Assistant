// main.js - Electron Main Process
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn, execSync } = require("child_process");
const axios = require("axios");

let mainWindow;
let flaskServerProcess;
let ollamaServeProcess;

// Function to kill an existing Ollama process
function killExistingOllama() {
  try {
    execSync("taskkill /IM ollama.exe /F", { stdio: "ignore" }); // Windows
    console.log("Killed existing Ollama process.");
  } catch (err) {
    console.log("No existing Ollama process found.");
  }
}

// Function to start a subprocess
function startProcess(command, args, name) {
  const process = spawn(command, args, { shell: true });

  process.stdout.on("data", (data) => console.log(`${name}: ${data}`));
  process.stderr.on("data", (data) => console.error(`${name} Error: ${data}`));

  process.on("close", (code) => console.log(`${name} process exited with code ${code}`));

  return process;
}

app.whenReady().then(() => {
  console.log("Stopping any existing Ollama server...");
  killExistingOllama();

  console.log("Starting Ollama server...");
  ollamaServeProcess = startProcess("ollama", ["serve"], "Ollama Serve");

  console.log("Starting Flask server...");
  flaskServerProcess = startProcess("python", [path.join(__dirname, "src/server.py")], "Flask Server");

  setTimeout(() => {
    console.log("Creating Electron window...");
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false, // More secure
        contextIsolation: true, // Enforce security
        preload: path.join(__dirname, "src/preload.js")
      },
    });

    mainWindow.loadFile(path.join(__dirname, "src/index.html"));

    mainWindow.on("closed", () => {
      mainWindow = null;
      killProcesses();
    });
  }, 5000); // Wait for Flask to start
});

app.on("window-all-closed", () => {
  killProcesses();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Function to kill all child processes
function killProcesses() {
  if (flaskServerProcess) {
    flaskServerProcess.kill();
    console.log("Flask server process killed.");
  }
  if (ollamaServeProcess) {
    ollamaServeProcess.kill();
    console.log("Ollama Serve process killed.");
  }
}

// ✅ Handle User Registration
ipcMain.handle("register", async (_, userData) => {
  try {
    const response = await axios.post("http://127.0.0.1:5000/register", userData, {
      headers: { "Content-Type": "application/json" }
    });
    return response.data;
  } catch (error) {
    console.error("Registration error:", error.response?.data || error.message);
    return { error: error.response?.data || "Registration failed" };
  }
});

// ✅ Handle User Login
ipcMain.handle("login", async (_, credentials) => {
  try {
    const response = await axios.post("http://127.0.0.1:5000/login", credentials, {
      headers: { "Content-Type": "application/json" }
    });
    return response.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    return { error: error.response?.data || "Login failed" };
  }
});
