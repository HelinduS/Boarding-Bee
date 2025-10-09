
# CI/CD Pipeline Documentation for Boarding Bee

## Overview

The Boarding Bee project uses GitHub Actions for comprehensive continuous integration and deployment (CI/CD), featuring a full-stack application with automated testing and Azure deployment. The pipeline includes backend API deployment, frontend build processes, comprehensive testing suites (unit and E2E), and sophisticated environment management.

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

## Next DevOps Roadmap

### Phase 1: Infrastructure & Monitoring (Q4 2025)

#### 1. Enhanced Monitoring & Observability
```yaml
Priority: High
Timeline: 4-6 weeks

Implementation:
- Application Performance Monitoring (APM):
  - Azure Application Insights integration
  - Real-time performance metrics
  - Error tracking and alerting
  
- Infrastructure Monitoring:
  - Azure Monitor for resource utilization
  - Database performance monitoring
  - Automated scaling triggers
  
- Logging Enhancements:
  - Structured logging with Serilog
  - Centralized log aggregation
  - Log analysis and dashboards
```

#### 2. Frontend Deployment Automation
```yaml
Priority: High
Timeline: 3-4 weeks

Implementation:
- Next.js Deployment Pipeline:
  - Automated frontend builds in CI/CD
  - Static site deployment to Azure Static Web Apps
  - CDN integration for global performance
  
- Environment Management:
  - Frontend staging environment
  - A/B testing capabilities
  - Feature flag integration
```

#### 3. Security Enhancements
```yaml
Priority: High
Timeline: 2-3 weeks

Implementation:
- Code Security Scanning:
  - GitHub Advanced Security integration
  - Dependency vulnerability scanning
  - Secret detection in commits
  
- Infrastructure Security:
  - Azure Key Vault for secrets management
  - Managed identity for Azure services
  - Network security groups and firewalls
```

### Phase 2: Advanced DevOps Practices (Q1 2026)

#### 4. Container Orchestration
```yaml
Priority: Medium
Timeline: 6-8 weeks

Implementation:
- Docker Containerization:
  - Multi-stage Docker builds
  - Container registry (Azure Container Registry)
  - Development environment standardization
  
- Kubernetes Migration:
  - Azure Kubernetes Service (AKS) deployment
  - Horizontal pod autoscaling
  - Service mesh integration (Istio)
```

#### 5. Quality Gates & Code Analysis
```yaml
Priority: Medium
Timeline: 4-5 weeks

Implementation:
- SonarQube Integration:
  - Code quality metrics
  - Technical debt tracking
  - Security vulnerability analysis
  
- Test Coverage Requirements:
  - Minimum coverage thresholds
  - Coverage reporting in PR reviews
  - Mutation testing implementation
```

#### 6. Database DevOps
```yaml
Priority: Medium
Timeline: 3-4 weeks

Implementation:
- Database Migration Automation:
  - Entity Framework migration scripts
  - Rollback procedures
  - Data seeding automation
  
- Database Testing:
  - Test database provisioning
  - Data anonymization for testing
  - Performance testing suites
```

### Phase 3: Advanced Automation & Scaling (Q2 2026)

#### 7. GitOps Implementation
```yaml
Priority: Medium
Timeline: 5-6 weeks

Implementation:
- ArgoCD/Flux Setup:
  - Declarative infrastructure management
  - Automated config drift detection
  - Multi-environment synchronization
  
- Infrastructure as Code:
  - Terraform/ARM templates
  - Environment provisioning automation
  - Disaster recovery automation
```

#### 8. Performance & Load Testing
```yaml
Priority: Medium
Timeline: 4-5 weeks

Implementation:
- Automated Performance Testing:
  - K6 or Artillery integration
  - Load testing in CI/CD pipeline
  - Performance regression detection
  
- Stress Testing:
  - Database load testing
  - API endpoint stress testing
  - Frontend performance monitoring
```

#### 9. Multi-Region Deployment
```yaml
Priority: Low
Timeline: 8-10 weeks

Implementation:
- Geographic Distribution:
  - Multi-region Azure deployment
  - Database replication strategies
  - Traffic routing optimization
  
- Disaster Recovery:
  - Automated backup procedures
  - Cross-region failover mechanisms
  - RTO/RPO optimization
```

### Phase 4: DevOps Excellence (Q3 2026)

#### 10. Advanced CI/CD Features
```yaml
Priority: Low
Timeline: 6-8 weeks

Implementation:
- Progressive Deployments:
  - Blue-green deployment strategies
  - Canary releases with automated rollback
  - Feature toggles integration
  
- Advanced Testing:
  - Chaos engineering with Chaos Monkey
  - Contract testing with Pact
  - Visual regression testing
```

#### 11. Developer Experience Enhancements
```yaml
Priority: Medium
Timeline: 4-6 weeks

Implementation:
- Local Development:
  - Docker Compose for full-stack local development
  - Hot reloading and debugging improvements
  - Development environment automation
  
- CI/CD Optimizations:
  - Build caching strategies
  - Parallel test execution
  - Pipeline performance monitoring
```

### Implementation Priorities

#### Immediate (Next 1-2 months)
1. **Application Performance Monitoring** - Critical for production visibility
2. **Frontend Deployment Automation** - Complete the full-stack CI/CD
3. **Security Scanning Integration** - Essential for production security

#### Short-term (3-6 months)
1. **Container Orchestration** - Improved scalability and deployment
2. **Quality Gates & SonarQube** - Enhanced code quality assurance
3. **Database DevOps** - Automated database management

#### Long-term (6-12 months)
1. **GitOps Implementation** - Advanced infrastructure management
2. **Multi-Region Deployment** - Global scalability and disaster recovery
3. **Chaos Engineering** - Production resilience testing

### Success Metrics

#### Performance Metrics
- **Deployment Frequency:** Target daily deployments
- **Lead Time:** < 2 hours from commit to production
- **Mean Time to Recovery (MTTR):** < 30 minutes
- **Change Failure Rate:** < 5%

#### Quality Metrics
- **Test Coverage:** > 80% for backend, > 70% for frontend
- **Code Quality Score:** > 8.0 on SonarQube scale
- **Security Vulnerabilities:** Zero high/critical in production

#### Operational Metrics
- **System Uptime:** > 99.9%
- **Response Time:** < 200ms for API endpoints
- **Error Rate:** < 0.1% in production

---

**Last Updated:** October 2025  
**Document Version:** 2.0  
**Maintained By:** DevOps Team
