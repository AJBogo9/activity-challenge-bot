# Contributing to Activity Challenge Bot

Thank you for your interest in contributing!

## Getting Started

### Prerequisites

- **Bun** v1.0+
- **PostgreSQL** v14+
- **Git**
- Telegram account for testing

See [Getting Started Guide](/guide/getting-started) for detailed setup.

### First-Time Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/activity-challenge-bot.git
cd activity-challenge-bot

# Add upstream
git remote add upstream https://github.com/EppuRuotsalainen/activity-challenge-bot.git

# Install and configure
bun install
cp .env.example .env
# Edit .env with your bot token

# Start development
bun run dev
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Tests

### 2. Make Changes

- Follow [code patterns](/development/patterns)
- Add tests for new functionality
- Update docs as needed

### 3. Test

```bash
bun run lint
bun test
bun run dev  # Manual testing in Telegram
```

### 4. Commit

```bash
git add .
git commit -m "feat: add guild leaderboard sorting"
```

**Commit format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

**Examples:**
```
feat: add weekly activity summary
fix: correct point calculation for cycling
docs: update installation instructions
refactor: simplify guild ranking logic
test: add tests for activity logging
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
# Go to GitHub and create Pull Request
```

## Coding Standards

### Bot-Specific Patterns

**Two-Message Manager:**
```typescript
import { TwoMessageManager } from '../../utils'

await TwoMessageManager.updateContent(ctx, text, keyboard)
await TwoMessageManager.deleteUserMessage(ctx)
```

**Wizard Steps:**
```typescript
export async function showStep(ctx: any) { }
export async function handleStep(ctx: any) { }
```

**Database Queries:**
```typescript
// Always use parameterized queries
const user = await sql`SELECT * FROM users WHERE telegram_id = ${telegramId}`
```

See [Code Patterns](/development/patterns) for complete guide.

### TypeScript

- Use type annotations for function parameters
- Use `async/await` (not `.then()`)
- Use descriptive variable names

```typescript
async function calculatePoints(metValue: number, duration: number): number {
  return (metValue * duration) / 60
}
```

### Error Handling

```typescript
export async function handleAction(ctx: any) {
  try {
    const user = await getUserByTelegramId(ctx.from.id)
    if (!user) {
      await ctx.reply('Please register first')
      return
    }
    // Process...
  } catch (error) {
    console.error('Error:', error)
    await ctx.reply('An error occurred')
  }
}
```

## Pull Request Guidelines

### Good PRs:

✅ Focused on single feature/fix
✅ Include tests
✅ Clear commit messages
✅ Update relevant docs
✅ Pass all checks

### Avoid:

❌ Multiple unrelated changes
❌ Breaking changes without discussion
❌ No tests for new features
❌ Unclear descriptions

### PR Template

Fill out completely:
- Description of changes
- Related issues (e.g., "Fixes #123")
- Screenshots (if UI changes)
- Testing done

## Reporting Issues

### Bug Reports

Include:
1. Clear description
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment (OS, Bun version)
5. Screenshots if applicable

### Feature Requests

Include:
1. Clear description
2. Use case (why needed?)
3. How it would work
4. Alternatives considered

### Security Issues

**Do not** create public issues. Email maintainers privately with details.

## Areas for Contribution

**Good First Issues:**
- Adding activity categories
- Improving error messages
- Writing documentation
- Adding tests

**Medium:**
- New wizard flows
- Performance improvements
- Statistics views

**Advanced:**
- Web app features
- Advanced analytics
- CI/CD improvements

## Questions?

- Check [documentation](/guide/getting-started)
- Search [existing issues](https://github.com/EppuRuotsalainen/activity-challenge-bot/issues)
- Create a [discussion](https://github.com/EppuRuotsalainen/activity-challenge-bot/discussions)

## Code of Conduct

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

Harassment, discrimination, or offensive comments are not tolerated.

## License

By contributing, you agree your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make this project better for everyone! 🎉

---

## Resources

- [Getting Started](/guide/getting-started)
- [Local Development](/guide/local-development)
- [Architecture Overview](/architecture/overview)
- [Code Patterns](/development/patterns)
- [Testing Guide](/development/testing)