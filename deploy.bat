@echo off
echo =======================================================
echo   BISHAL TRAVELS - 1-Click Build ^& Deploy Script
echo =======================================================
echo.

echo [1/4] Running production build and verifying TypeScript...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed. Please fix errors before deploying.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Staging and committing changes...
git add .
git commit -m "chore: automated build and deployment update"

echo.
echo [3/4] Pushing to GitHub (origin/master)...
git push origin master

echo.
echo [4/4] Deployment complete!
echo Your updates are pushed to GitHub and will automatically deploy.
echo Repository: https://github.com/Rahulrock-1/bishal-travels
echo.
pause
