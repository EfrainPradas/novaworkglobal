---
description: safely add, commit, and push changes to GitHub bypassing WSL git credential hangs
---

# Update GitHub Workflow

Use this workflow whenever the user asks to "update github", "push to github", "commit", or "subelo". This is necessary because `git push` often gets stuck waiting for credentials inside the WSL environment.

### Steps

1. **Check Status** (Optional)
   Verify which files were changed.
   `wsl -d Ubuntu -e bash -c 'cd /mnt/c/Ubuntu/home/efraiprada/novaworkglobal/active && git status'`

2. **Add and Commit**
   Always include a clear and descriptive commit message using the conventional commits format (e.g. `feat:`, `fix:`).
   `wsl -d Ubuntu -e bash -c 'cd /mnt/c/Ubuntu/home/efraiprada/novaworkglobal/active && git add <files> && git commit -m "<message>"'`

3. **Push via Windows PowerShell (CRITICAL)**
   Avoid running `git push` inside `wsl` because it blocks on password prompts. Instead, use the Windows `cmd.exe` or `git` executable which resolves credentials through the Windows Credential Manager.

// turbo
```powershell
cmd.exe /c "cd /d C:\Ubuntu\home\efraiprada\novaworkglobal\active && git push origin main"
```

4. **Notify User**
   Inform the user what was pushed and that it was successful.
