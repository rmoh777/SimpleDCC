# Phase 1: Setup (always safe)
git checkout master && git pull origin master && git checkout -b [BRANCH_NAME]

# Phase 2: Commit work (after I confirm what to add)
git add [FILES] && git commit -m "[MESSAGE]" && git push origin [BRANCH_NAME]

# Phase 3: Create PR (final step)
gh pr create --title "[TITLE]" --body "[BODY]" --base master --head [BRANCH_NAME]