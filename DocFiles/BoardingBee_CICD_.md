# CI/CD Pipeline Documentation for Boarding Bee

## Overview

The Boarding Bee project uses GitHub Actions for comprehensive continuous integration and deployment (CI/CD), featuring a full-stack application with automated testing and Azure deployment. The pipeline includes backend API deployment, frontend build processes, comprehensive testing suites (unit and E2E), and sophisticated environment management.

## Branching strategy

A simple, practical branching strategy to support CI/CD and safe releases:

- Branches
  - `main`: production-ready code. All deploys to production come from `main`.
  - `dev`: integration branch where feature branches are merged for integration testing and staging builds.
  - `feature/*`: short-lived feature branches (naming: `feature/<jira>-short-desc` or `feature/<dev>-<desc>`).
  - `hotfix/*`: emergency fixes that must be applied directly to `main` and merged back to `dev`.

- Pull Requests
  - All merges into `dev` or `main` must use Pull Requests with at least one approving review.
  - PRs into `main` must have passing CI (unit + E2E smoke tests) and a maintainer approval.
  - Use descriptive PR titles and link to ticket/issue IDs.

- Protection Rules
  - Protect `main` with branch protection: require status checks, require PR reviews, and disable force pushes.
  - Protect `dev` with status checks (build + tests) and require at least one approval.

- Merge Flow
  - Feature branches → open PR → CI runs (lint, unit tests, preview deploy for PR) → merge to `dev`.
  - When `dev` is validated and ready, open PR from `dev` → `main` for release (include changelog and release notes).
  - Hotfix: branch from `main`, open PR to `main`, then merge to `dev` after deployment.

- Naming and lifetime
  - Keep feature branches short-lived (few days). Delete branches after merge.

This strategy keeps releases predictable, enables PR preview deploys for frontend features, and ensures production safety.

## Pipeline Architecture

The Boarding Bee CI/CD pipeline follows a comprehensive three-stage approach:

```
            Source Code (GitHub)
        ┌────────────────────────┐
        │      GitHub Repo       │
        │   - Backend (.NET)     │
        │   - Frontend (Next.js) │
        │   - Tests (Unit + E2E)  │
        └───────────┬────────────┘
                    │ Push / PR
                    ▼
        ┌────────────────────────┐
        │   GitHub Actions       │
        │  ┌──────────────────┐ │
        │  │   Test Stage     │ │
        │  │ • Unit Tests     │ │
        │  │ • E2E Tests      │ │
        │  │ • Integration    │ │
        │  └──────────────────┘ │
        │  ┌──────────────────┐ │
        │  │  Build Stage     │ │
        │  │ • .NET Build     │ │
        │  │ • Next.js Build  │ │
        │  │ • Artifact Gen   │ │
        │  └──────────────────┘ │
        │  ┌──────────────────┐ │
        │  │  Deploy Stage    │ │
        │  │ • Azure Deploy   │ │
        │  │ • Prod Only      │ │
        │  └──────────────────┘ │
        └───────────┬────────────┘
                    │ Deploy
                    ▼
        ┌────────────────────────┐
        │     Azure Cloud        │
        │  ┌──────────────────┐ │
        │  │   Backend API    │ │
        │  │  (App Service)   │ │
        │  └──────────────────┘ │
        │  ┌──────────────────┐ │
        │  │   Database       │ │
        │  │  (SQL Server)    │ │
        │  └──────────────────┘ │
        └────────────────────────┘
```

## Workflows

### 1. Main CI/CD Pipeline (`main_boardingbee.yml`)

**Triggers:**
- Push to `main` branch
- Push to `dev` branch  
- Pull request to `dev` branch
- Manual workflow dispatch

**Workflow Steps:**

#### Test Job
1. **Environment Setup**
   - Ubuntu latest runner
   - .NET 9.x SDK installation
   - Node.js 18 setup
   - Repository checkout

2. **Environment Configuration**
   ```yaml
   Backend .env creation:
   - SMTP configuration for email services
   - Database connection string (Azure SQL)
   - JWT secret for authentication
   
   Frontend .env creation:
   - API URL configuration
   - Base URL setup
   ```

3. **Dependency Installation**
   ```yaml
   - Root dependencies (npm install)
   - Backend dependencies (dotnet restore)
   - Frontend dependencies (npm install)
   ```

4. **Build Process**
   ```yaml
   - Backend build (dotnet build --configuration Release)
   - Frontend build (npm run build)
   ```

5. **Service Startup**
   ```yaml
   - Backend service startup on port 5000
   - Frontend service startup on port 3000
   - Health check verification
   - Service readiness validation
   ```

6. **Testing Infrastructure**
   ```yaml
   - Google Chrome installation for Selenium
   - ChromeDriver setup
   - Test environment preparation
   ```

7. **E2E Test Execution**
   ```yaml
   Sequential Selenium tests:
   - User registration test
   - User login test
   - Owner registration test
   - Owner login test
   - Owner dashboard test
   - Tenant review test
   ```

#### Build Job
- **Dependencies:** Requires successful test job completion
- **Process:**
  1. .NET Core setup
  2. Backend build in Release configuration
  3. Application publishing to artifact directory
  4. Artifact upload for deployment

#### Deploy Job
- **Condition:** Only runs on `main` branch after successful build
- **Process:**
  1. Download build artifacts
  2. Deploy to Azure Web App using publish profile
  3. Target: Production slot

### 2. Test Automation Scripts

#### E2E Test Runner (`run-e2e-tests.sh`)
```bash
Features:
- Sequential test execution
- Test user cleanup (before/after)
- Chrome process management
- Individual test isolation
```

#### Comprehensive Test Runner (`run-all-tests.sh`)
```bash
Features:
- .NET unit test execution
- Selenium E2E test suite
- Unique Chrome user data directories
- Process cleanup between tests
```

## Tools & Integrations

### Primary CI/CD Platform
- **GitHub Actions**
  - Native GitHub integration
  - YAML-based workflow configuration
  - Built-in secrets management
  - Artifact storage and management

### Cloud Deployment Target
- **Azure Web Apps** (Backend API)
  - Production slot deployment
  - Publish profile authentication
  - Automatic scaling capabilities

### Development Tools Integration
- **.NET 9.x SDK**
  - Cross-platform runtime
  - Built-in testing framework
  - Package management via NuGet

- **Next.js Frontend Framework**
  - React-based application
  - TypeScript support
  - Modern build system

### Testing Infrastructure
- **Selenium WebDriver**
  - End-to-end browser automation
  - Chrome headless testing
  - Cross-browser compatibility

- **Mocha Test Framework**
  - JavaScript testing framework
  - Asynchronous test support
  - Test reporting and coverage

- **.NET Unit Testing**
  - xUnit/NUnit framework
  - Integration testing
  - Test coverage reporting

### Quality Assurance Tools
- **ESLint & Prettier** (Frontend)
  - Code formatting and linting
  - TypeScript support
  - Custom rule configuration

- **SonarQube Integration** (Planned)
  - Code quality analysis
  - Security vulnerability detection
  - Technical debt tracking

## Secrets & Credentials Management

### GitHub Secrets Configuration

#### Azure Web App Service
```
AZUREAPPSERVICE_PUBLISHPROFILE_218ADA24A09E410495DFFF1C71419EBD
├── Purpose: Azure Web App deployment
├── Type: Publish Profile (XML)
├── Contains: Deployment credentials, endpoints, settings
└── Usage: Backend API deployment authentication
```

### Environment Variables in CI/CD

#### Backend Environment Variables (.env)
```yaml
- SMTP Configuration:
  - Smtp__Host: smtp.gmail.com
  - Smtp__Port: 587
  - Smtp__User: helindusenadheera@gmail.com
  - Smtp__Pass: [GitHub Secrets]
  - Smtp__From: helindusenadheera@gmail.com
  
- Database Configuration:
  - DB_CONNECTION_STRING: Azure SQL Database connection
  
- Authentication:
  - JWT_SECRET: Strong secret key for JWT tokens
```

#### Frontend Environment Variables (.env)
```yaml
- API Configuration:
  - NEXT_PUBLIC_API_URL: http://localhost:5000
  - BASE_URL: http://localhost:3000
```

### Security Best Practices

#### Secret Management
- **Storage:** GitHub repository secrets (encrypted at rest)
- **Access:** Limited to workflow execution context
- **Rotation:** Regular credential rotation recommended
- **Scope:** Repository-level access control

#### Authentication Methods
- **Publish Profiles:** Azure-generated deployment credentials

## Deployment Environments

### Production Environment
- **Backend:** Azure Web App Service
  - URL: `https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net`
  - Slot: Production
  - Auto-scaling enabled

### Development Environment
- **Branch:** `dev`
- **Process:** Build and test only (no deployment)
- **Purpose:** Integration testing and validation

## Rollback Procedures

### Automated Rollback Triggers
- **Build Failures:** Pipeline stops, no deployment occurs
- **Test Failures:** Deployment blocked until tests pass
- **Deployment Failures:** Azure handles automatic rollback

### Manual Rollback Options

#### Backend API Rollback
1. **Azure Portal Method:**
   ```
   Azure Portal → App Services → BoardingBee
   → Deployment Center → Deployment History
   → Select previous successful deployment → Redeploy
   ```

2. **GitHub Actions Method:**
   ```
   Actions → Select previous successful workflow
   → Re-run deployment job
   ```

### Rollback Verification
- **Health Checks:** Automated endpoint monitoring
- **Smoke Tests:** Basic functionality validation

## Monitoring & Notifications

### Pipeline Monitoring
- **GitHub Actions Dashboard:** Real-time workflow status
- **Email Notifications:** Failure alerts to repository maintainers

### Application Monitoring
- **Azure Application Insights:** Performance and error tracking
- **Azure Monitor:** Infrastructure health monitoring

## Troubleshooting Guide

### Common Issues

#### Build Failures
```yaml
Issue: Dependency restoration fails
Solution: Clear cache, update package versions
Command: dotnet clean && dotnet restore
```

#### Test Failures
```yaml
Issue: E2E tests fail due to Chrome process conflicts
Solution: Kill leftover Chrome processes, clean user data directories
Commands: 
  - pkill chrome || true
  - pkill chromedriver || true
```

#### Deployment Failures
```yaml
Issue: Azure deployment timeout
Solution: Check publish profile validity, Azure service status
Action: Regenerate publish profile if expired
```

### Debug Commands
```bash
# Local build verification
dotnet build --configuration Release --verbosity detailed

# Local test execution
dotnet test --logger "console;verbosity=detailed"

# Frontend build verification
cd BoardingBee_frontend && npm run build

# E2E test debugging
./run-e2e-tests.sh
```

## Maintenance Schedule

### Regular Tasks
- **Weekly:** Review pipeline performance metrics
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Credential rotation and security audit

## Current DevOps Status (October 2025)

### ✅ Completed Implementations

#### CI/CD Infrastructure
- **GitHub Actions Pipeline:** Fully automated build, test, and deploy workflow
- **Multi-Environment Support:** Dev and production branch strategies
- **Automated Testing:** Unit tests and E2E Selenium tests integrated
- **Artifact Management:** Build artifacts stored and managed through GitHub Actions

#### Testing Framework
- **Backend Unit Tests:** .NET testing framework implemented
- **E2E Testing Suite:** Comprehensive Selenium WebDriver tests covering:
  - User registration and authentication flows
  - Owner dashboard functionality
  - Tenant review system
  - Cross-browser compatibility testing
- **Test Data Management:** Automated test user creation and cleanup
- **Test Isolation:** Unique Chrome user data directories per test

#### Deployment & Infrastructure
- **Azure Cloud Deployment:** Production backend deployed to Azure App Service
- **Database Integration:** Azure SQL Database connectivity
- **Email Services:** SMTP configuration for notifications
- **Environment Configuration:** Automated .env file generation

#### Security & Configuration
- **Secrets Management:** GitHub Secrets for sensitive data
- **Environment Variables:** Proper separation of dev/prod configurations
- **JWT Authentication:** Secure token-based authentication system

### 🔄 In Progress

#### Monitoring & Observability
- **Health Checks:** Basic endpoint monitoring implemented
- **Logging:** Application logs captured during CI/CD runs
 
## Frontend Continuous Deployment (CD) — next DevOps sprint (brief)

Add a lightweight, reliable CD flow for the Next.js frontend so the next DevOps can implement and operate it quickly:

- Goal: build, test and deploy the frontend automatically on pushes to `main`, and create preview deploys for PRs.
- Recommended target: Azure Static Web Apps (preferred for Next.js) or Azure App Service (if SSR required).
- Pipeline steps (concise):
  1. Checkout repository
  2. Setup Node.js 18
  3. Install dependencies: `npm ci` (use cache)
  4. Run lint & unit tests (fast fail on critical errors)
  5. Build: `npm run build`
  6. Upload artifacts or use native Static Web Apps action
  7. Deploy using `azure/static-web-apps-deploy` or `azure/webapps-deploy` with publish profile or token
  8. Post-deploy smoke tests and healthcheck
  9. Notify team on success/failure (GitHub PR comment or Slack)

- Required secrets / env (examples):
  - NEXT_PUBLIC_API_URL
  - AZURE_STATIC_WEBAPP_API_TOKEN or AZUREAPPSERVICE_PUBLISHPROFILE_XXXXX

- Post-deploy tasks:
  - Run a small set of smoke/e2e checks (home page loads, login endpoint reachable)
  - Invalidate CDN or flush cache if used
  - Provide manual rollback instructions (redeploy previous artifact or swap slots)

## Sprint DevOps Tasks (brief)

Add these recurring items to the sprint backlog for the DevOps engineer:

- CI/CD housekeeping: dependency updates, pipeline caching, add frontend PR preview deploys, and improve job parallelism.
- Security & maintenance: rotate secrets, apply OS/runtime patches, and update vulnerable packages.
- Backups & DR: verify DB backups, publish restore runbook.
- Observability: add browser telemetry (App Insights or RUM), synthetic uptime checks for frontend.
- Testing: add quick frontend unit tests and linting in CI; include frontend smoke tests post-deploy.
- Documentation & handover: update README with deploy steps, contact list, and runbook for rollbacks.

