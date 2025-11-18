# Boarding Bee Deployment Guide

This guide explains how to deploy the Boarding Bee project (Next.js frontend + ASP.NET Core backend) to Azure using GitHub Actions for CI/CD.

---

## Prerequisites
- Azure account with permissions to create Web Apps and Static Web Apps
- GitHub repository with project code
- Azure CLI installed (for manual setup)
- [Optional] Visual Studio or VS Code for local development

---

## 1. Azure Resources Overview
- **Frontend:** Deployed as a Next.js app to Azure Static Web Apps (`boardingbee-atf5gegteud8hpc0`)
- **Frontend URL:** https://delightful-ground-0f0c8b400.azurestaticapps.net
- **Backend:** Deployed as an ASP.NET Core Web API to Azure App Service (Web App) (`boardingbee`)
- **Backend URL:** https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net
- **Database:** Azure SQL Database (`BoardingBeeDB`)
- **Blob Storage:** Azure Storage Account (`boardingbee`)

---

## 2. Environment Variables

### Backend (`BoardingBee_backend/.env`)
- `Smtp__Host=smtp.gmail.com`
- `Smtp__Port=587`
- `Smtp__User=helindusenadheera@gmail.com`
- `Smtp__Pass=your-app-password`
- `Smtp__From=helindusenadheera@gmail.com`
- `DB_CONNECTION_STRING=Server=tcp:boardingbee.database.windows.net,1433;Initial Catalog=BoardingBeeDB;Persist Security Info=False;User ID=boardingbee;Password=#Boarding1234;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`
- `JWT_SECRET=your-very-strong-secret-key-1234567890abcdef`
- `AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=boardingbee;AccountKey=<your-storage-key>;EndpointSuffix=core.windows.net`

### Frontend (`BoardingBee_frontend/.env`)
- `NEXT_PUBLIC_API_URL=https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net`
- `BASE_URL=https://delightful-ground-0f0c8b400.azurestaticapps.net`

---

## 3. GitHub Actions Workflows

### a. Frontend: `.github/workflows/azure-static-web-apps-*.yml`
- Triggers on push to `main`
- Builds and deploys `BoardingBee_frontend` to Azure Static Web Apps
- Sets `NEXT_PUBLIC_API_URL` to the backend's deployed URL

### b. Backend: `.github/workflows/main_boardingbee.yml`
- Triggers on push to `main`, `dev`, or `testing/**`
- Builds, tests, and deploys `BoardingBee_backend` to Azure Web App
- Runs unit and E2E tests, generates reports
- Publishes to Azure using a publish profile secret

---

## 4. Azure Setup Steps

### a. Create Azure Resources
1. **Azure Static Web App**: Name: `delightful-ground-0f0c8b400` (for frontend)
2. **Azure App Service (Web App)**: Name: `boardingbee` (for backend)
3. **Azure SQL Database**: Name: `BoardingBeeDB` (for data)
4. **Azure Storage Account**: Name: `boardingbee` (for file uploads)

### b. Configure Secrets in GitHub
- `AZURE_STATIC_WEB_APPS_API_TOKEN_DELIGHTFUL_GROUND_0F0C8B400`: For Static Web Apps deployment
- `AZUREAPPSERVICE_PUBLISHPROFILE_218ADA24A09E410495DFFF1C71419EBD`: For backend App Service deployment
- SMTP and DB credentials as needed

---

## 5. Deployment Process

### a. On Code Push
- Pushing to `main` triggers both workflows
- Frontend is built and deployed to Azure Static Web Apps
- Backend is built, tested, and deployed to Azure Web App

### b. Manual Deployment
- You can trigger workflows manually via GitHub Actions tab ("Run workflow")

---

## 6. Post-Deployment
- Access the frontend at: https://delightful-ground-0f0c8b400.azurestaticapps.net
- Access the backend at: https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net
- Ensure environment variables are set correctly in Azure and GitHub
- Test all endpoints and features

---

## 7. Troubleshooting
- Check GitHub Actions logs for build/deploy errors
- Use Azure Portal for logs and diagnostics
- Ensure all secrets and environment variables are set
- For CORS/API issues, verify `NEXT_PUBLIC_API_URL` and backend CORS settings

---

## 8. Useful Links
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

For further help, check the project README files or contact the maintainer.
