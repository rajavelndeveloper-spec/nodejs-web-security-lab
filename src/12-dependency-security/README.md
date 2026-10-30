# 12. Dependency Security

## Overview

Dependency security helps protect a Node.js application from vulnerabilities in third-party packages.

Applications use external packages such as Express, Helmet, dotenv, and other npm libraries. These packages may contain security vulnerabilities, so we must regularly audit, update, and manage them.

## Learning Objectives

- Understand dependency security.
- Check packages for known vulnerabilities using `npm audit`.
- Identify outdated packages using `npm outdated`.
- Fix compatible dependency vulnerabilities using `npm audit fix`.
- Understand the difference between `package.json` and `package-lock.json`.
- Install dependencies cleanly using `npm ci`.
- Follow secure dependency management practices.

## 1. Check for Vulnerabilities

Run:

```bash
npm audit
```

This command checks the dependency tree against known vulnerability information.

Example output:

```text
found 0 vulnerabilities
```

This means npm did not detect any known vulnerabilities in the dependency tree it checked.

**Note:** Zero reported vulnerabilities does not guarantee that all dependencies are completely secure.

## 2. Fix Vulnerabilities

Run:

```bash
npm audit fix
```

This attempts to fix known vulnerabilities by updating dependencies within compatible version ranges.

Avoid running the following command blindly:

```bash
npm audit fix --force
```

It may install versions with breaking changes. Review the proposed changes and test the application before using them.

## 3. Check Outdated Packages

Run:

```bash
npm outdated
```

This command shows packages with newer versions available.

The output can include:

- **Current:** The version currently installed.
- **Wanted:** The newest version that satisfies the version range in `package.json`.
- **Latest:** The latest version published to npm.

If the command produces no output, npm has no outdated packages to report for the current project.

## 4. Update Dependencies

Update packages within their allowed version ranges:

```bash
npm update
```

To update a specific package:

```bash
npm update dotenv
```

To install the latest version of a specific package:

```bash
npm install dotenv@latest
```

Installing the latest version may introduce breaking changes. Check the package's changelog and test the application after updating it.

## 5. Understand package.json and package-lock.json

### package.json

- Lists the application's dependencies and their allowed version ranges.
- Contains project metadata and npm scripts.
- Defines which packages the project requires.

### package-lock.json

- Records the exact resolved dependency versions and related installation information.
- Helps developers and CI/CD pipelines install consistent dependency trees.
- Should normally be committed to version control for an application.

**Important:** Do not delete `package-lock.json` simply to resolve an installation or audit issue.

## 6. Clean Installation Using npm ci

Run:

```bash
npm ci
```

`npm ci` installs dependencies based on the lockfile.

Key points:

- Removes the existing `node_modules` directory before installation.
- Requires `package.json` and `package-lock.json` to be consistent.
- Does not update `package.json` or `package-lock.json`.
- Is useful for CI/CD pipelines and reproducible installations.

If installation fails on Windows with an `EPERM` error, a running Node.js process or another application may be locking a file. Stop the relevant process and retry the installation.

## 7. Recommended Dependency Security Workflow

Run these commands when reviewing dependency security:

```bash
npm outdated
npm audit
npm audit fix
npm ci
npm audit
```

Review the changes and run the project's tests after updating dependencies.

For important production applications, include dependency auditing and automated testing in the CI/CD pipeline.

## 8. Security Best Practices

- Keep dependencies updated and maintained.
- Review npm audit findings and their severity.
- Prefer trusted packages with active maintenance.
- Avoid unnecessary dependencies.
- Commit `package-lock.json` to version control.
- Review breaking changes before major-version upgrades.
- Run automated tests after updating dependencies.
- Investigate suspicious or unexpected dependency changes.
- Never assume that a clean audit guarantees complete application security.

## 9. Practical Results

Commands tested in this project:

| Command | Result |
|---|---|
| `npm audit fix` | Fixed the reported dependency vulnerability |
| `npm update dotenv` | Updated the dotenv dependency within its allowed version range |
| `npm ci` | Installed 151 packages successfully |
| `npm audit` | Found 0 vulnerabilities |
| `npm outdated` | No outdated packages reported |

The initial audit reported a high-severity vulnerability involving `body-parser`. After applying the available fix, reinstalling dependencies, and auditing again, npm reported zero known vulnerabilities.

## Conclusion

Dependency security is an ongoing process. Regular audits, careful updates, lockfile management, clean installations, and automated tests help reduce the risk of vulnerable third-party packages in Node.js applications.