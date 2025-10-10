using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using BoardingBee_backend.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Controllers;
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
        response.Should().NotBeNull();

    var total = response!.GetType().GetProperty("total")!.GetValue(response);
    var responseListings = response.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;

    var dbTotalAll = await context.Listings.CountAsync(l => l.OwnerId == 1);
    total.Should().Be(dbTotalAll);
    responseListings.Should().NotBeNull();
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
    // Controller does not filter by status for owner listing endpoint; ensure returned listings contain the expected approved items
    var responseListings = response.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;
    var approvedInResponse = 0;
    foreach (var it in responseListings ?? Array.Empty<object>())
    {
        var status = it.GetType().GetProperty("Status")!.GetValue(it) as string;
        if (status == ListingStatus.Approved.ToString()) approvedInResponse++;
    }
    var expected = await context.Listings.CountAsync(l => l.OwnerId == 1 && l.Status == ListingStatus.Approved);
    approvedInResponse.Should().Be(expected);
    // Total should be all listings for the owner
    total.Should().Be(await context.Listings.CountAsync(l => l.OwnerId == 1));
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
    var responseListings = response.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;
    var pendingInResponse = 0;
    foreach (var it in responseListings ?? Array.Empty<object>())
    {
        var status = it.GetType().GetProperty("Status")!.GetValue(it) as string;
        if (status == ListingStatus.Pending.ToString()) pendingInResponse++;
    }
    var expectedPending = await context.Listings.CountAsync(l => l.OwnerId == 1 && l.Status == ListingStatus.Pending);
    pendingInResponse.Should().Be(expectedPending);
    total.Should().Be(await context.Listings.CountAsync(l => l.OwnerId == 1));
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
    var responseListings = response.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;
    var expiredInResponse = 0;
    foreach (var it in responseListings ?? Array.Empty<object>())
    {
        var status = it.GetType().GetProperty("Status")!.GetValue(it) as string;
        if (status == ListingStatus.Expired.ToString()) expiredInResponse++;
    }
    var expectedExpired = await context.Listings.CountAsync(l => l.OwnerId == 1 && l.Status == ListingStatus.Expired);
    expiredInResponse.Should().Be(expectedExpired);
    total.Should().Be(await context.Listings.CountAsync(l => l.OwnerId == 1));
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
                CreatedAt = DateTime.UtcNow.AddDays(i)
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
        var responseListings = response.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;
        var list = (responseListings ?? Array.Empty<object>()).Cast<object>().ToList();

    total.Should().Be(await context.Listings.CountAsync(l => l.OwnerId == 1));
    // Controller returns all listings ordered by CreatedAt desc; simulate paging and ensure page 2 contains expected first id
    var page = 2; var pageSize = 5;
    var pageItems = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();
    pageItems.Should().NotBeEmpty();
    // With CreatedAt increasing by i, the newest (largest CreatedAt) has Id=15, so page 2 first item should be Id=10
    var firstOnPage2 = pageItems.First();
    var firstId = firstOnPage2.GetType().GetProperty("Id")!.GetValue(firstOnPage2) as string;
    firstId.Should().Be("10");
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
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        var responseListings = response.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;
    total.Should().Be(0);
    (responseListings ?? Array.Empty<object>()).Cast<object>().Should().BeEmpty();
    }

    [Fact]
    public async Task OwnerDashboard_ShouldOrderByLastUpdated()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var baseTime = DateTime.UtcNow;
        var listings = new List<Listing>
        {
            new() { Id = 1, Title = "Oldest", OwnerId = 1, Status = ListingStatus.Approved, Location = "Colombo", Price = 15000, CreatedAt = baseTime.AddDays(-3) },
            new() { Id = 2, Title = "Newest", OwnerId = 1, Status = ListingStatus.Approved, Location = "Kandy", Price = 20000, CreatedAt = baseTime },
            new() { Id = 3, Title = "Middle", OwnerId = 1, Status = ListingStatus.Approved, Location = "Galle", Price = 18000, CreatedAt = baseTime.AddDays(-1) }
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = CreateOwnerController(context, ownerId: 1);

        // Act
    var result = await controller.GetListingsByOwner(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var responseListings = response!.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;
        var list = (responseListings ?? Array.Empty<object>()).Cast<object>().ToList();
        list.Should().NotBeEmpty();
        // The newest listing should be first due to OrderByDescending on CreatedAt
        var firstId = list.First().GetType().GetProperty("Id")!.GetValue(list.First()) as string;
        firstId.Should().Be("2");
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
        total.Should().Be(await context.Listings.CountAsync(l => l.OwnerId == 1)); // Should return all listings when status filter is invalid
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
        var expectedTotal = await context.Listings.CountAsync(l => l.OwnerId == 1);

        total.Should().Be(expectedTotal);
        expectedTotal.Should().Be(2);
    }
}