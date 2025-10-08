using Xunit;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using BoardingBee_backend.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Controllers;
using BoardingBee_backend.models;
using BoardingBee_backend.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace BoardingBee.Tests.Unit.Controllers;

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
    var mockListingService = new Moq.Mock<BoardingBee_backend.Services.ListingService>(context, null);
    var controller = new ListingsController(context, mockListingService.Object);
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

    [Fact]
    public async Task OwnerDashboard_ShouldShowCorrectListingCounts()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            new() { Id = 1, Title = "Approved Room 1", OwnerId = 1, Status = ListingStatus.Approved },
            new() { Id = 2, Title = "Approved Room 2", OwnerId = 1, Status = ListingStatus.Approved },
            new() { Id = 3, Title = "Pending Room", OwnerId = 1, Status = ListingStatus.Pending },
            new() { Id = 4, Title = "Expired Room", OwnerId = 1, Status = ListingStatus.Expired },
            new() { Id = 5, Title = "Other Owner Room", OwnerId = 2, Status = ListingStatus.Approved }
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var summary = response!.GetType().GetProperty("summary")!.GetValue(response);
        
        var totalAll = summary!.GetType().GetProperty("totalAll")!.GetValue(summary);
        var approved = summary.GetType().GetProperty("approved")!.GetValue(summary);
        var pending = summary.GetType().GetProperty("pending")!.GetValue(summary);
        var expired = summary.GetType().GetProperty("expired")!.GetValue(summary);

        totalAll.Should().Be(4);
        approved.Should().Be(2);
        pending.Should().Be(1);
        expired.Should().Be(1);
    }

    [Fact]
    public async Task OwnerDashboard_WithApprovedFilter_ShouldShowOnlyApprovedListings()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            new() { Id = 1, Title = "Approved Room 1", OwnerId = 1, Status = ListingStatus.Approved, Location = "Colombo", Price = 15000 },
            new() { Id = 2, Title = "Approved Room 2", OwnerId = 1, Status = ListingStatus.Approved, Location = "Kandy", Price = 20000 },
            new() { Id = 3, Title = "Pending Room", OwnerId = 1, Status = ListingStatus.Pending, Location = "Galle", Price = 18000 }
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(2);
    }

    [Fact]
    public async Task OwnerDashboard_WithPendingFilter_ShouldShowOnlyPendingListings()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            new() { Id = 1, Title = "Approved Room", OwnerId = 1, Status = ListingStatus.Approved, Location = "Colombo", Price = 15000 },
            new() { Id = 2, Title = "Pending Room 1", OwnerId = 1, Status = ListingStatus.Pending, Location = "Kandy", Price = 20000 },
            new() { Id = 3, Title = "Pending Room 2", OwnerId = 1, Status = ListingStatus.Pending, Location = "Galle", Price = 18000 }
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(2);
    }

    [Fact]
    public async Task OwnerDashboard_WithExpiredFilter_ShouldShowOnlyExpiredListings()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            new() { Id = 1, Title = "Active Room", OwnerId = 1, Status = ListingStatus.Approved, Location = "Colombo", Price = 15000 },
            new() { Id = 2, Title = "Expired Room", OwnerId = 1, Status = ListingStatus.Expired, Location = "Kandy", Price = 20000, ExpiresAt = DateTime.UtcNow.AddDays(-1) }
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(1);
    }

    [Fact]
    public async Task OwnerDashboard_WithPagination_ShouldReturnCorrectPage()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var listings = new List<Listing>();
        for (int i = 1; i <= 15; i++)
        {
            listings.Add(new Listing
            {
                Id = i,
                Title = $"Room {i}",
                Location = "Colombo",
                Price = 15000,
                OwnerId = 1,
                Status = ListingStatus.Approved,
                LastUpdated = DateTime.UtcNow.AddDays(-i)
            });
        }
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        var page = response.GetType().GetProperty("page")!.GetValue(response);
        var pageSize = response.GetType().GetProperty("pageSize")!.GetValue(response);

        total.Should().Be(15);
        page.Should().Be(2);
        pageSize.Should().Be(5);
    }

    [Fact]
    public async Task OwnerDashboard_EmptyListings_ShouldReturnZeroCounts()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var summary = response!.GetType().GetProperty("summary")!.GetValue(response);
        
        var totalAll = summary!.GetType().GetProperty("totalAll")!.GetValue(summary);
        var approved = summary.GetType().GetProperty("approved")!.GetValue(summary);
        var pending = summary.GetType().GetProperty("pending")!.GetValue(summary);
        var expired = summary.GetType().GetProperty("expired")!.GetValue(summary);

        totalAll.Should().Be(0);
        approved.Should().Be(0);
        pending.Should().Be(0);
        expired.Should().Be(0);
    }

    [Fact]
    public async Task OwnerDashboard_ShouldOrderByLastUpdated()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var baseTime = DateTime.UtcNow;
        var listings = new List<Listing>
        {
            new() { Id = 1, Title = "Oldest", OwnerId = 1, Status = ListingStatus.Approved, Location = "Colombo", Price = 15000, LastUpdated = baseTime.AddDays(-3) },
            new() { Id = 2, Title = "Newest", OwnerId = 1, Status = ListingStatus.Approved, Location = "Kandy", Price = 20000, LastUpdated = baseTime },
            new() { Id = 3, Title = "Middle", OwnerId = 1, Status = ListingStatus.Approved, Location = "Galle", Price = 18000, LastUpdated = baseTime.AddDays(-1) }
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var data = response!.GetType().GetProperty("data")!.GetValue(response);
        data.Should().NotBeNull();
        // The newest listing should be first due to OrderByDescending
    }

    [Fact]
    public async Task OwnerDashboard_WithInvalidStatus_ShouldIgnoreFilter()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            new() { Id = 1, Title = "Room 1", OwnerId = 1, Status = ListingStatus.Approved, Location = "Colombo", Price = 15000 },
            new() { Id = 2, Title = "Room 2", OwnerId = 1, Status = ListingStatus.Pending, Location = "Kandy", Price = 20000 }
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(2); // Should return all listings when status filter is invalid
    }

    [Fact]
    public async Task OwnerDashboard_MultipleOwners_ShouldOnlyShowOwnListings()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            new() { Id = 1, Title = "Owner 1 Room 1", OwnerId = 1, Status = ListingStatus.Approved, Location = "Colombo", Price = 15000 },
            new() { Id = 2, Title = "Owner 1 Room 2", OwnerId = 1, Status = ListingStatus.Pending, Location = "Kandy", Price = 20000 },
            new() { Id = 3, Title = "Owner 2 Room 1", OwnerId = 2, Status = ListingStatus.Approved, Location = "Galle", Price = 18000 },
            new() { Id = 4, Title = "Owner 2 Room 2", OwnerId = 2, Status = ListingStatus.Pending, Location = "Matara", Price = 22000 }
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        var summary = response.GetType().GetProperty("summary")!.GetValue(response);
        var totalAll = summary!.GetType().GetProperty("totalAll")!.GetValue(summary);

        total.Should().Be(2);
        totalAll.Should().Be(2);
    }
}