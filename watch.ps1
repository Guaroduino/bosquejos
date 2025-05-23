# Configuration
$watchPath = $PSScriptRoot  # Current directory
$fileTypes = @("*.js", "*.html", "*.css", "*.svg")  # File types to watch
$lastCommitTime = Get-Date
$cooldownPeriod = 30  # Seconds to wait between pushes

Write-Host "Starting file watcher..."
Write-Host "Watching for changes in: $watchPath"
Write-Host "Watching file types: $($fileTypes -join ', ')"
Write-Host "Press Ctrl+C to stop watching"

# Function to commit and push changes
function Push-Changes {
    $currentTime = Get-Date
    $timeSinceLastCommit = ($currentTime - $lastCommitTime).TotalSeconds

    if ($timeSinceLastCommit -lt $cooldownPeriod) {
        Write-Host "Skipping push - too soon since last commit"
        return
    }

    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Auto commit at $date"

    Write-Host "Changes detected! Pushing..."
    
    # Add all changes
    git add .

    # Commit changes
    git commit -m $commitMessage

    # Push to remote repository
    git push origin main

    $script:lastCommitTime = Get-Date
    Write-Host "Changes pushed successfully!"
}

# Create a file system watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Register event handlers
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    $name = $Event.SourceEventArgs.Name

    # Check if the file type matches our watch list
    $shouldWatch = $false
    foreach ($type in $fileTypes) {
        if ($name -like $type) {
            $shouldWatch = $true
            break
        }
    }

    if ($shouldWatch) {
        Write-Host "`nChange detected: $changeType - $name"
        Push-Changes
    }
}

# Register the event handlers
Register-ObjectEvent $watcher "Created" -Action $action
Register-ObjectEvent $watcher "Changed" -Action $action
Register-ObjectEvent $watcher "Deleted" -Action $action
Register-ObjectEvent $watcher "Renamed" -Action $action

# Keep the script running
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    # Cleanup
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Get-EventSubscriber | Unregister-Event
} 