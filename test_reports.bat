@echo off
REM Test Report Submission Feature

echo ===================================
echo   TEST REPORT SUBMISSION FEATURE
echo ===================================

cd d:\khoaluan

REM Check if backend is running
echo.
echo Checking if backend server is running...
netstat -ano | findstr "8080" >nul
if %errorlevel%==0 (
    echo OK - Backend server is running on port 8080
) else (
    echo ERROR - Backend server is not running. Start the backend first.
    exit /b 1
)

REM Run test
echo.
echo Running test...
node test_report_submission.js

pause
