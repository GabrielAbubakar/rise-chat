# Git Branching Workflow

This project follows a structured feature-branch workflow.

## 1. Starting Work (Branching from `dev`)

All new features, bug fixes, and improvements should branch off of the `dev` branch, never `master`.

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

## 2. Merging Features (PR to `dev`)

Once your feature is complete:

1. Commit and push your feature branch to the remote repository.
2. Open a Pull Request (PR) targeting the `dev` branch.
3. After review and approval, merge your feature into `dev`.

## 3. Releases (PR from `dev` to `master`)

The `master` branch represents the stable production environment.
Once `dev` has accumulated multiple features and is fully tested, a release Pull Request is created to merge `dev` into `master`.

_Note: Developers should not open PRs directly to `master`._
