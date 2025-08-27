@echo off
echo Running File Category Migration Script...
echo.

cd /d "%~dp0.."
node scripts/add-file-category-migration.js

echo.
echo Migration completed. Press any key to exit...
pause >nul
