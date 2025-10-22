# Pre-commit Hooks Setup

This repository now has pre-commit hooks configured to maintain code quality and prevent direct pushes to the main branch.

## What's Configured

### 1. Pre-commit Hook
- **Triggered:** Before every commit
- **Actions:**
  - Validates all changed entity score JSON files using `npm run validate`
  - Runs ESLint on JavaScript files with auto-fix
- **Files checked:** Only staged files that match the patterns

### 2. Pre-push Hook
- **Triggered:** Before pushing to remote repository
- **Actions:**
  - Prevents direct pushes to the `main` branch
  - Runs full validation on all entity score files using `npm run validate-all`
  - Only allows push if all validations pass

## Installation

The hooks are automatically installed when you run:
```bash
npm install
```

This triggers the `prepare` script which runs `husky install`.

## Commands Added

- `npm run validate-all` - Validates all entity score files
- `npm run prepare` - Sets up git hooks (runs automatically on npm install)

## Hook Files

- `.husky/pre-commit` - Runs lint-staged for file validation
- `.husky/pre-push` - Prevents main branch pushes and runs full validation

## Configuration

The `lint-staged` configuration in `package.json` defines what happens for different file types:

```json
{
  "lint-staged": {
    "entity-scores/*.json": [
      "npm run validate"
    ],
    "scripts/**/*.js": [
      "eslint --fix"
    ]
  }
}
```

## Bypassing Hooks (Not Recommended)

If you absolutely need to bypass the hooks:
- Skip pre-commit: `git commit --no-verify`
- Skip pre-push: `git push --no-verify`

## Workflow

1. Make changes to entity score files
2. Stage your changes: `git add .`
3. Commit: `git commit -m "your message"`
   - Pre-commit hook validates changed files
4. Push: `git push origin your-branch`
   - Pre-push hook prevents pushing to main and validates all files

## Troubleshooting

### "Direct push to main branch is not allowed"
Create a feature branch instead:
```bash
git checkout -b feature/your-feature-name
git push origin feature/your-feature-name
```

### Validation Errors
Fix the validation errors in your entity score files. Common issues:
- Invalid score percentages (must be 0-100)
- Invalid scoreSuccess values
- Missing required fields
- TODO placeholders in comments

### Node.js Version Issues
If you see compatibility warnings, consider upgrading to Node.js 16+ for better compatibility with the latest tools.