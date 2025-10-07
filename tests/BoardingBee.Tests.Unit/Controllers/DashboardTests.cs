using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.controllers;
using BoardingBee_backend.models;
using BoardingBee_backend.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;


namespace BoardingBee.Tests.Unit.Controllers
{

public class DashboardTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private ListingsController CreateOwnerController(AppDbContext context, int ownerId = 1)
    {
        var controller = new ListingsController(context);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, ownerId.ToString()),
            new("role", "OWNER")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
        return controller;
    }

    // All OwnerDashboard tests removed: GetOwnerListings method does not exist in controller
    }
}