# Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic changelog generation.

## Format

```
<type>: <short description>

[optional body]

[optional footer]
```

## Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | MINOR (1.x.0) |
| `fix` | Bug fix | PATCH (1.0.x) |
| `docs` | Documentation only | None |
| `style` | Code style (formatting, semicolons) | None |
| `refactor` | Code change that neither fixes a bug nor adds a feature | None |
| `perf` | Performance improvement | None |
| `test` | Adding or updating tests | None |
| `chore` | Build process, tooling, dependencies | None |

## Breaking Changes

Append `!` after the type or include `BREAKING CHANGE:` in the footer for a MAJOR version bump.

```
feat!: redesign provider interface

BREAKING CHANGE: DataSourceProvider.scrape() now requires ScrapeOptions object instead of positional args.
```

## Examples

```
feat: add mock data source provider
fix: handle AbortSignal in polling loop
docs: update deployment guide for Docker
chore: bump conventional-changelog-cli to v5
refactor: extract date cutoff logic into shared utility
```

## Releasing

```bash
# Patch release (bug fixes): 1.0.1 -> 1.0.2
npm version patch

# Minor release (new features): 1.0.2 -> 1.1.0
npm version minor

# Major release (breaking changes): 1.1.0 -> 2.0.0
npm version major
```

This automatically:
1. Bumps version in package.json
2. Regenerates CHANGELOG.md from conventional commits
3. Creates a git commit + tag
4. Pushes to remote (triggers GitHub Release workflow)
