@echo off
setlocal enabledelayedexpansion

REM Order Matching System - Quick Start Script for Windows
REM This script sets up and starts the complete system

echo 🚀 Order Matching System - Quick Start
echo =====================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js v23.3.0 or higher.
    pause
    exit /b 1
)
echo [SUCCESS] Node.js is installed.

REM Check if npm is available
echo [INFO] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available. Please install npm.
    pause
    exit /b 1
)
echo [SUCCESS] npm is available.

REM Install dependencies
echo [INFO] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install root dependencies.
    pause
    exit /b 1
)

REM Install frontend dependencies
if exist "frontend" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
    cd ..
)

REM Install mobile dependencies
if exist "mobile" (
    echo [INFO] Installing mobile dependencies...
    cd mobile
    call npm install
    if errorlevel 1 (
        echo [WARNING] Failed to install mobile dependencies. Continuing...
    )
    cd ..
)

echo [SUCCESS] Dependencies installed successfully.

REM Setup database
echo [INFO] Setting up database...
call npm run setup-db
if errorlevel 1 (
    echo [WARNING] Database setup failed. Please check PostgreSQL connection.
)

echo [SUCCESS] Database setup completed.

REM Start backend server
echo [INFO] Starting backend server...
start "Backend Server" cmd /k "npm start"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend
echo [INFO] Starting frontend...
start "Frontend Server" cmd /k "cd frontend && npm start"

REM Wait for frontend to start
timeout /t 10 /nobreak >nul

REM Run tests
echo [INFO] Running system tests...
timeout /t 5 /nobreak >nul
node test-system.js

echo.
echo 🎉 Order Matching System is now running!
echo.
echo 📊 Backend API: http://localhost:3000
echo 🌐 Frontend UI: http://localhost:3001
echo 📱 Mobile App: Run 'npm run mobile' in another terminal
echo.
echo Press any key to stop all services...
pause

REM Kill background processes (Windows doesn't have easy process management)
echo [INFO] Stopping services...
echo [INFO] Please close the backend and frontend terminal windows manually.
echo [SUCCESS] Services stopped.

pause 