# Claude Rules for This Repository

## PR Workflow
- Always create a new branch from updated `main` before writing any code (`git checkout main && git pull origin main && git checkout -b feature/...`)
- Never add commits to an already-merged PR — always check if the branch's PR is merged before committing
- Before creating a new PR, save a backup copy of the app file as `<filename>.bak.html` (e.g. `life-info/index.html.bak`) so the previous version is preserved in the repo

## Data Safety
- When modifying data structures or storage logic, ensure existing records cannot be lost — use merge strategies, never replace/overwrite
- Always use a database (Firebase Firestore is already configured for this repo) to persist data, not just localStorage
- localStorage is acceptable only as a cache/fallback, not the primary store
- Data must be accessible from any device, not just the local machine

## App Standards
- Every PR must include a version bump visible in the app UI (e.g. `v1.0` → `v1.1` in the header or footer)
- Every app must have a Home button that links back to the main page (`/Personal/index.html`)
- Apps must be deployable and accessible from the web via GitHub Pages — no local-only features

## Commit Messages
- Always end commit messages with the session URL: `https://claude.ai/code/session_01BCiThisGxHrw7BVGi32tZp`
