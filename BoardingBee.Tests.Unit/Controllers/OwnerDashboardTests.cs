using Xunit;
using System.Threading.Tasks;
using FluentAssertions;
using BoardingBee_backend.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Controllers;
using BoardingBee_backend.models;
using BoardingBee_backend.Models;
using System;
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

        var responseType = response!.GetType();
        var summaryProperty = responseType.GetProperty("summary");
        summaryProperty.Should().NotBeNull();

        var summary = summaryProperty!.GetValue(response);
        var totalAllProperty = summary!.GetType().GetProperty("totalAll");
        var approvedProperty = summary.GetType().GetProperty("approved");
        var pendingProperty = summary.GetType().GetProperty("pending");
        var expiredProperty = summary.GetType().GetProperty("expired");

        totalAllProperty!.GetValue(summary).Should().Be(4);
        approvedProperty!.GetValue(summary).Should().Be(2);
        pendingProperty!.GetValue(summary).Should().Be(1);
        expiredProperty!.GetValue(summary).Should().Be(1);
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
        totalProperty!.GetValue(response).Should().Be(2);
    }

    [Fact]
    public async Task GetOwnerListings_WithPagination_ShouldReturnPagedResults()
    {
        var ownerId = 1;
        for (int i = 1; i <= 15; i++)
        {
            CreateTestListing($"Listing {i}", ListingStatus.Approved, ownerId);
        }

    var result = await _controller.GetListingsByOwner(ownerId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();

        var responseType = response!.GetType();
        var pageProperty = responseType.GetProperty("page");
        var pageSizeProperty = responseType.GetProperty("pageSize");
        var totalProperty = responseType.GetProperty("total");

        pageProperty!.GetValue(response).Should().Be(2);
        pageSizeProperty!.GetValue(response).Should().Be(5);
        totalProperty!.GetValue(response).Should().Be(15);
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

        // Check if listing was auto-expired
        var listing = await _context.Listings.FindAsync(expiredListing.Id);
        listing!.Status.Should().Be(ListingStatus.Expired);
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

        var responseType = response!.GetType();
        var summaryProperty = responseType.GetProperty("summary");
        var summary = summaryProperty!.GetValue(response);

        var totalAllProperty = summary!.GetType().GetProperty("totalAll");
        var approvedProperty = summary.GetType().GetProperty("approved");
        var pendingProperty = summary.GetType().GetProperty("pending");
        var expiredProperty = summary.GetType().GetProperty("expired");

        totalAllProperty!.GetValue(summary).Should().Be(6);
        approvedProperty!.GetValue(summary).Should().Be(3);
        pendingProperty!.GetValue(summary).Should().Be(2);
        expiredProperty!.GetValue(summary).Should().Be(1);
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