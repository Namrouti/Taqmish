@echo off
cd /d "c:\Users\widad\AndroidStudioProjects\Taqmish"
call gradlew.bat assembleDebug
if %ERRORLEVEL% EQU 0 (
    echo Build successful, installing...
    adb install -r app\build\outputs\apk\debug\app-debug.apk
    echo Starting app...
    adb shell am start -n com.dresstips.taqmish/.MainActivity
) else (
    echo Build failed with error code %ERRORLEVEL%
)
