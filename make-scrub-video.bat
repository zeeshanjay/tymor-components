@echo off
echo ================================================
echo  Holobox Video Optimizer - Scroll Scrub Ready
echo ================================================
echo.

where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
  echo  ffmpeg not found on your system.
  echo.
  echo  To get ffmpeg FREE in 2 minutes:
  echo  1. Go to https://www.gyan.dev/ffmpeg/builds/
  echo  2. Download "ffmpeg-release-essentials.zip"
  echo  3. Extract it, go inside the "bin" folder
  echo  4. Copy ffmpeg.exe to this folder:
  echo     %~dp0
  echo  5. Run this bat file again.
  echo.
  pause
  exit /b
)

echo  Converting model\3dvideo.mp4 for smooth scroll scrub...
echo  (This may take 1-3 minutes depending on video length)
echo.

ffmpeg -i "%~dp0model\3dvideo.mp4" ^
  -vcodec libx264 ^
  -x264opts keyint=1:min-keyint=1 ^
  -preset slow ^
  -crf 20 ^
  -acodec copy ^
  "%~dp0model\3dvideo-scrub.mp4" ^
  -y

if %errorlevel% equ 0 (
  echo.
  echo  Done! File saved as: model\3dvideo-scrub.mp4
  echo.
  echo  Now update the video source in luxury-hero-preview.html:
  echo  Change: model/3dvideo.mp4
  echo  To:     model/3dvideo-scrub.mp4
) else (
  echo.
  echo  Something went wrong. Make sure model\3dvideo.mp4 exists.
)

echo.
pause
