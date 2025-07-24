# Cursor Terminal Troubleshooting Guide

This guide documents common terminal issues encountered in this specific project environment and provides solutions to avoid getting stuck, particularly with `git` commands.

## 🚨 PRIMARY ISSUE: Git Pager Interactivity

The most common problem is `git` launching an interactive pager (like `less`) which I cannot exit because I cannot send keyboard commands like `q` or `RETURN`. This makes commands like `git branch`, `git log`, `git add .`, and sometimes even `git status` hang indefinitely.

---

## ✅ SOLUTIONS

Follow these solutions in order.

### Solution 1: Use `-c core.pager=cat` (Preferred Method)

This is the most reliable and contained solution. It disables the pager for a *single command* without changing any configuration.

**Syntax:**
```bash
git -c core.pager=cat [command]
```

**Example (Staging all files):**
```bash
git -c core.pager=cat add -A
```

**Example (Viewing branches):**
```bash
git -c core.pager=cat branch
```

### Solution 2: Chaining Commands (Efficient)

To perform a full sequence of add, commit, and push, chain the commands together using `&&`. This minimizes the risk of the pager launching between steps.

**Example:**
```bash
git -c core.pager=cat add . && git commit -m "Your commit message" && git push origin your-branch-name
```

### Solution 3: The `gh pr create` command

The `gh` CLI tool is non-interactive when all arguments are provided. Always use flags like `--title`, `--body`, `--base`, and `--head`.

**Example:**
```bash
gh pr create --title "feat: My New Feature" --body "This PR implements X, Y, and Z." --base master --head your-branch-name
```

---

## 🛑 STUCK? Emergency Procedures

If you are stuck and see messages like `Log file is already in use (press RETURN)`, the environment is in a bad state.

### Step 1: Kill Stuck Processes

First, try to kill any lingering `git` or `less` processes that might be holding a lock.

```powershell
taskkill /F /IM less.exe 2>$null; taskkill /F /IM git.exe 2>$null; echo "Cleaned up processes"
```

### Step 2: Last Resort - User Intervention

If all automated attempts fail, the terminal environment is unrecoverable for me. **DO NOT** loop endlessly. Escalate to the user immediately.

1.  **Explain the Problem:** Clearly state that the terminal is in a locked, interactive state that you cannot exit.
2.  **Provide Exact Commands:** Give the user the precise, non-interactive commands to run themselves.

**Example Last Resort Message:**

> "I am stuck in a terminal state that I cannot exit programmatically. Please run the following commands in your terminal to complete the process:"
>
> ```bash
> # 1. Stage changes
> git add .
>
> # 2. Commit
> git commit -m "Your message"
>
> # 3. Push
> git push origin your-branch-name
>
> # 4. Create PR
> gh pr create --title "Your Title" --body "Your description"
> ``` 