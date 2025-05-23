# Get current date and time for commit message
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Auto commit at $date"

# Add all changes
git add .

# Commit changes
git commit -m $commitMessage

# Push to remote repository
git push origin main

Write-Host "Changes pushed successfully!" 