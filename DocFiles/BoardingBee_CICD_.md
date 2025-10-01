
# CI/CD Pipeline Documentation for Boarding Bee

## Overview

The Boarding Bee project uses GitHub Actions for continuous integration and deployment, with the current setup focusing on the backend deployment to Azure Web Apps.

## Pipeline Architecture
            Source Code (GitHub)
        ┌────────────────────────┐
                 GitHub          
        │        Repo          
        └───────────┬────────────┘
                    │ Push / PR
                    ▼
        ┌────────────────────────┐
             GitHub Actions     
             CI/CD Workflow       
        └───────────┬────────────┘
                    │ Build / Deploy
                    ▼
        ┌────────────────────────┐
              Azure Cloud       
             App Deployment      
        └────────────────────────┘

## Workflows

### 1. Backend API Pipeline (`boardingbee-backend.yml`)

**Triggers:**
- Push to `dev` branch
- Pull request to `main` branch
- Manual workflow dispatch

**Workflow Steps:**

#### Build Job
1. **Environment Setup**
   - Ubuntu latest runner
   - .NET 9.x SDK installation
   - Repository checkout

2. **Build Process**
   ```yaml
   - Restore NuGet dependencies
   - Build the application in Release configuration
   ```

#### Deploy Job
- **Condition:** Only runs on `main` branch after successful build
- **Process:**
  1. Download build artifacts
  2. Deploy to Azure Web App using the publish profile
  3. Target: Production slot

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

## Secrets & Credentials Management

### GitHub Secrets Configuration

#### Azure Web App Service
```
AZUREAPPSERVICE_PUBLISHPROFILE_BOARDING_BEE
├── Purpose: Azure Web App deployment
├── Type: Publish Profile (XML)
├── Contains: Deployment credentials, endpoints, settings
└── Usage: Backend API deployment authentication
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
```

## Maintenance Schedule

### Regular Tasks
- **Weekly:** Review pipeline performance metrics
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Credential rotation and security audit

---

**Last Updated:** September 2025  
**Document Version:** 1.0  
**Maintained By:** DevOps Team
