---
description: Automatically add, commit, and push changes to GitHub
---

# GitHub Push Workflow

This workflow automates the standard git push process.

1. **Check Status**: Verify current repository state.
2. **Add Changes**: Stage all changes in the directory.
3. **Commit**: Create a commit with a timestamp.
4. **Push**: Push the changes to the remote repository.

```powershell
git status
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-update: $timestamp"
# Check if credential helper is interfering (optional safety)
git config --local --unset credential.helper
git push origin main
```
