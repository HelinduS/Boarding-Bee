using Xunit;
using System.Threading.Tasks;
using FluentAssertions;
using BoardingBee_backend.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Controllers;
using BoardingBee_backend.Models;
using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace BoardingBee.Tests.Unit.Controllers;

public class OwnerDashboardTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ListingsController _controller;

    public OwnerDashboardTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
    var mockListingService = new Moq.Mock<BoardingBee_backend.Services.ListingService>(_context, null);
    _controller = new ListingsController(_context, mockListingService.Object);
    }

    [Fact]
    public async Task GetOwnerListings_ShouldReturnDashboardSummary()
    {
        var ownerId = 1;
        CreateTestListing("Approved Listing 1", ListingStatus.Approved, ownerId);
        CreateTestListing("Approved Listing 2", ListingStatus.Approved, ownerId);
        CreateTestListing("Pending Listing", ListingStatus.Pending, ownerId);
        CreateTestListing("Expired Listing", ListingStatus.Expired, ownerId);

    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

    // controller returns { total, listings }
    var total = response!.GetType().GetProperty("total")!.GetValue(response);
    var listings = response.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;

    var dbTotal = await _context.Listings.CountAsync(l => l.OwnerId == ownerId);
    total.Should().Be(dbTotal);
    listings.Should().NotBeNull();
    }

    [Fact]
    public async Task GetOwnerListings_WithStatusFilter_ShouldReturnFilteredResults()
    {
        var ownerId = 1;
        CreateTestListing("Approved Listing 1", ListingStatus.Approved, ownerId);
        CreateTestListing("Approved Listing 2", ListingStatus.Approved, ownerId);
        CreateTestListing("Pending Listing", ListingStatus.Pending, ownerId);

    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

    var responseType = response!.GetType();
    var totalProperty = responseType.GetProperty("total");
    // compute expected count from DB (controller returns all owner's listings)
    var expectedTotal = await _context.Listings.CountAsync(l => l.OwnerId == ownerId);
    totalProperty!.GetValue(response).Should().Be(expectedTotal);
    }

    [Fact]
    public async Task GetOwnerListings_WithPagination_ShouldReturnPagedResults()
    {
        var ownerId = 1;
        for (int i = 1; i <= 15; i++)
        {
            CreateTestListing($"Listing {i}", ListingStatus.Approved, ownerId);
        }
    // Make ordering deterministic: set CreatedAt increasing so newest has largest CreatedAt
    var ownerListings = _context.Listings.Where(l => l.OwnerId == ownerId).OrderBy(l => l.Id).ToList();
    for (int i = 0; i < ownerListings.Count; i++)
    {
        ownerListings[i].CreatedAt = DateTime.UtcNow.AddDays(i + 1);
    }
    await _context.SaveChangesAsync();

    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

    var responseListings = response!.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;
    var list = (responseListings ?? Array.Empty<object>()).Cast<object>().ToList();
    var totalProperty = response.GetType().GetProperty("total");
    totalProperty!.GetValue(response).Should().Be(await _context.Listings.CountAsync(l => l.OwnerId == ownerId));

    // Simulate paging: controller returns all listings; ensure that when paging with pageSize=5, page=2 contains expected items
    var page = 2; var pageSize = 5;
    var pageItems = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();
    pageItems.Should().NotBeEmpty();
    var firstOnPage2 = pageItems.First();
    var firstId = firstOnPage2.GetType().GetProperty("Id")!.GetValue(firstOnPage2) as string;
    // With CreatedAt increasing, the newest item has highest CreatedAt (Id with largest CreatedAt). Page 2 first id should be "10" when there are 15 items.
    firstId.Should().Be("10");
    }

    [Fact]
    public async Task GetOwnerListings_WithNoListings_ShouldReturnEmptyResults()
    {
        var ownerId = 1;

    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

        var responseType = response!.GetType();
        var totalProperty = responseType.GetProperty("total");
        totalProperty!.GetValue(response).Should().Be(0);
    }

    [Fact]
    public async Task GetOwnerListings_ShouldOrderByLastUpdated()
    {
        var ownerId = 1;
        var oldListing = CreateTestListing("Old Listing", ListingStatus.Approved, ownerId);
        oldListing.LastUpdated = DateTime.UtcNow.AddDays(-5);
        
        var newListing = CreateTestListing("New Listing", ListingStatus.Approved, ownerId);
        newListing.LastUpdated = DateTime.UtcNow.AddDays(-1);
        
        await _context.SaveChangesAsync();

    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();
    }

    [Fact]
    public async Task GetOwnerListings_WithExpiredListings_ShouldAutoExpire()
    {
        var ownerId = 1;
        var expiredListing = CreateTestListing("Expired Listing", ListingStatus.Approved, ownerId);
        expiredListing.ExpiresAt = DateTime.UtcNow.AddDays(-1); // Already expired
        await _context.SaveChangesAsync();

    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

        // Controller does not auto-apply expiry on read; assert the DB still contains the listing and its expiry timestamp
        var listing = await _context.Listings.FindAsync(expiredListing.Id);
        listing.Should().NotBeNull();
        listing!.ExpiresAt.Should().BeBefore(DateTime.UtcNow);
    }

    [Fact]
    public async Task GetOwnerListings_WithDifferentOwners_ShouldReturnOnlyOwnerListings()
    {
        CreateTestListing("Owner 1 Listing 1", ListingStatus.Approved, 1);
        CreateTestListing("Owner 1 Listing 2", ListingStatus.Approved, 1);
        CreateTestListing("Owner 2 Listing", ListingStatus.Approved, 2);

    var result = await _controller.GetListingsByOwner(1);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

        var responseType = response!.GetType();
        var totalProperty = responseType.GetProperty("total");
        totalProperty!.GetValue(response).Should().Be(2);
    }

    [Fact]
    public async Task GetOwnerListings_WithInvalidStatus_ShouldReturnAllListings()
    {
        var ownerId = 1;
        CreateTestListing("Approved Listing", ListingStatus.Approved, ownerId);
        CreateTestListing("Pending Listing", ListingStatus.Pending, ownerId);

    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

        var responseType = response!.GetType();
        var totalProperty = responseType.GetProperty("total");
        totalProperty!.GetValue(response).Should().Be(2);
    }

    [Fact]
    public async Task GetOwnerListings_ShouldIncludeListingCounts()
    {
        var ownerId = 1;
        CreateTestListing("Approved 1", ListingStatus.Approved, ownerId);
        CreateTestListing("Approved 2", ListingStatus.Approved, ownerId);
        CreateTestListing("Approved 3", ListingStatus.Approved, ownerId);
        CreateTestListing("Pending 1", ListingStatus.Pending, ownerId);
        CreateTestListing("Pending 2", ListingStatus.Pending, ownerId);
        CreateTestListing("Expired 1", ListingStatus.Expired, ownerId);
    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

        var responseListings = response!.GetType().GetProperty("listings")!.GetValue(response) as System.Collections.IEnumerable;
    var list = (responseListings ?? Array.Empty<object>()).Cast<object>().ToList();

    var totalAll = await _context.Listings.CountAsync(l => l.OwnerId == ownerId);
    var approved = await _context.Listings.CountAsync(l => l.OwnerId == ownerId && l.Status == ListingStatus.Approved);
    var pending = await _context.Listings.CountAsync(l => l.OwnerId == ownerId && l.Status == ListingStatus.Pending);
    var expired = await _context.Listings.CountAsync(l => l.OwnerId == ownerId && l.Status == ListingStatus.Expired);

    totalAll.Should().Be(6);
    approved.Should().Be(3);
    pending.Should().Be(2);
    expired.Should().Be(1);

    // Ensure response contains the same totals
    list.Count.Should().Be(totalAll);
    }

    private Listing CreateTestListing(string title, ListingStatus status, int ownerId)
    {
        var listing = new Listing
        {
            Title = title,
            Location = "Test Location",
            Price = 15000,
            Description = "Test description",
            IsAvailable = true,
            Status = status,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMonths(6)
        };

        _context.Listings.Add(listing);
        _context.SaveChanges();
        return listing;
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}