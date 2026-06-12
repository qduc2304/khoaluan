@echo off
echo Dang kiem tra va don dep tien trinh cu tren cong 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /f /pid %%a 2>nul

echo Khoi dong lai Backend Server...
cd backend
npm start

pause