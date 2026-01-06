# Contributing to Activity Challenge Bot

Thank you for your interest in contributing to the Activity Challenge Bot! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for everyone. We expect all contributors to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or deliberate disruption
- Publishing others' private information without consent
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

Before you begin contributing, ensure you have:

- **Bun** v1.0 or higher installed
- **PostgreSQL** v14 or higher
- **Git** for version control
- A **Telegram account** for testing
- Basic knowledge of **TypeScript** and **Telegram Bot API**

See the [Getting Started Guide](/guide/getting-started) for detailed setup instructions.

### First-Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/activity-challenge-bot.git
   cd activity-challenge-bot
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/EppuRuotsalainen/activity-challenge-bot.git
   ```
4. **Install dependencies**:
   ```bash
   bun install
   ```
5. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your bot token and database credentials
   ```
6. **Start development**:
   ```bash
   bun run dev
   ```

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

### 2. Make Your Changes

- Write clean, readable code following our [code patterns](/development/patterns)
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run linter
bun run lint

# Run tests
bun test

# Test manually in Telegram
bun run dev
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add guild leaderboard sorting"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add weekly activity summary
fix: correct point calculation for cycling
docs: update installation instructions
refactor: simplify guild ranking logic
test: add tests for activity logging
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
```

## Coding Standards

### TypeScript Style

Follow these TypeScript conventions:

```typescript
// Use async/await, not promises
async function getData() {
  try {
    const result = await fetchData()
    return result
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

// Use descriptive variable names
const userActivityCount = 5  // ✅ Good
const uac = 5                // ❌ Bad

// Use type annotations for function parameters
function calculatePoints(metValue: number, duration: number): number {
  return (metValue * duration) / 60
}
```

### Database Queries

Use the postgres library's tagged template syntax:

```typescript
// ✅ Good - Safe from SQL injection
const user = await sql`
  SELECT * FROM users WHERE telegram_id = ${telegramId}
`

// ❌ Bad - Vulnerable to SQL injection
const user = await sql.unsafe(
  `SELECT * FROM users WHERE telegram_id = '${telegramId}'`
)
```

### Error Handling

Always handle errors gracefully:

```typescript
export async function handleUserAction(ctx: any) {
  try {
    const user = await getUserByTelegramId(ctx.from.id.toString())
    if (!user) {
      await ctx.reply('Please register first with /start')
      return
    }
    // Process action...
  } catch (error) {
    console.error('Error in handleUserAction:', error)
    await ctx.reply('An error occurred. Please try again.')
  }
}
```

### Telegram Bot Patterns

Follow the Two-Message Manager pattern:

```typescript
import { TwoMessageManager } from '../../utils'

async function handleStep(ctx: any) {
  const tmm = new TwoMessageManager(ctx)
  
  // Show question
  await tmm.showQuestion('Select an option:', keyboard)
  
  // Later, show answer
  await tmm.showAnswer('✅ Selected: Option 1')
}
```

See [Code Patterns](/development/patterns) for more examples.

## Submitting Changes

### Pull Request Guidelines

When creating a pull request:

1. **Fill out the PR template** completely
2. **Reference any related issues**: "Fixes #123"
3. **Describe your changes** clearly
4. **Add screenshots** if UI is affected
5. **Ensure all tests pass**
6. **Update documentation** if needed

### PR Review Process

1. **Automated checks** run (linting, tests)
2. **Code review** by maintainers
3. **Changes requested** or **approved**
4. **Merge** by maintainers

Please be patient - reviews may take a few days.

### What Makes a Good PR?

✅ **Good PRs**:
- Focused on a single feature or fix
- Include tests
- Have clear commit messages
- Update relevant documentation
- Pass all checks

❌ **Avoid**:
- Multiple unrelated changes in one PR
- Breaking changes without discussion
- No tests for new features
- Unclear or missing descriptions

## Reporting Issues

### Bug Reports

When reporting a bug, include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Exact steps to recreate the bug
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: OS, Bun version, etc.
6. **Screenshots**: If applicable

Example:

```markdown
**Description**
Points are not calculated correctly for cycling activities.

**Steps to reproduce**
1. Log a cycling activity
2. Set duration to 30 minutes
3. Check points awarded

**Expected behavior**
Should award 4.0 points (MET 8.0 × 30 / 60)

**Actual behavior**
Awards 8.0 points

**Environment**
- OS: Ubuntu 22.04
- Bun: v1.0.15
- Bot version: main branch
```

### Feature Requests

When requesting a feature:

1. **Clear description** of the feature
2. **Use case**: Why is this needed?
3. **Examples**: How would it work?
4. **Alternatives**: Other solutions considered

Please search existing issues first to avoid duplicates.

### Security Issues

**Do not** create public issues for security vulnerabilities. Instead:

1. Email the maintainers privately
2. Describe the vulnerability
3. Include steps to reproduce
4. Wait for confirmation before disclosing

## Areas for Contribution

Looking for something to work on? Consider these areas:

### Good First Issues

- Adding new activity categories
- Improving error messages
- Writing documentation
- Adding tests for existing features

### Medium Difficulty

- Implementing new wizard flows
- Adding database indexes
- Improving performance
- Creating new statistics views

### Advanced

- Adding web app features
- Implementing advanced analytics
- Optimizing database queries
- Adding CI/CD pipelines

## Questions?

If you have questions:

1. Check the [documentation](/guide/getting-started)
2. Search [existing issues](https://github.com/EppuRuotsalainen/activity-challenge-bot/issues)
3. Create a [discussion](https://github.com/EppuRuotsalainen/activity-challenge-bot/discussions)
4. Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! 🎉

---

## Additional Resources

- [Getting Started Guide](/guide/getting-started)
- [Local Development Guide](/guide/local-development)
- [Architecture Overview](/architecture/overview)
- [Code Patterns](/development/patterns)
- [Testing Guide](/development/testing)
- [Project Structure](/development/project-structure)