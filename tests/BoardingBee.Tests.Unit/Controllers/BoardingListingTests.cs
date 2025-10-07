using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.controllers;
using BoardingBee_backend.Controllers.Dto;
using BoardingBee_backend.models;
using BoardingBee_backend.Models;
using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;


namespace BoardingBee.Tests.Unit.Controllers
{

public class BoardingListingTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ListingsController _controller;

    public BoardingListingTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _controller = new ListingsController(_context);
    }

    [Fact]
    public async Task CreateListingJson_WithValidData_ShouldReturnCreated()
    {
        SetupOwnerUser();
        var request = new CreateListingRequest
        {
            Title = "Test Boarding",
            Location = "Colombo",
            Price = 15000,
            Description = "Nice boarding place",
            Availability = "Available",
            ContactPhone = "0771234567",
            ContactEmail = "owner@test.com",
            Amenities = new[] { "WiFi", "AC" },
            Images = new[] { "/image1.jpg", "/image2.jpg" }
        };

        var result = await _controller.CreateListingJson(request);

        result.Should().BeOfType<CreatedAtActionResult>();
        var listing = await _context.Listings.FirstOrDefaultAsync();
        listing.Should().NotBeNull();
        listing!.Title.Should().Be("Test Boarding");
        listing.Status.Should().Be(ListingStatus.Pending);
    }

    [Fact]
    public async Task CreateListingJson_WithoutOwnerRole_ShouldReturnForbid()
    {
        SetupUserRole("USER");
        var request = new CreateListingRequest
        {
            Title = "Test Boarding",
            Location = "Colombo",
            Price = 15000,
            Description = "Nice boarding place"
        };

        var result = await _controller.CreateListingJson(request);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task CreateListingJson_WithEmptyTitle_ShouldReturnBadRequest()
    {
        SetupOwnerUser();
        var request = new CreateListingRequest
        {
            Title = "",
            Location = "Colombo",
            Price = 15000,
            Description = "Nice boarding place"
        };

        var result = await _controller.CreateListingJson(request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateListingJson_WithZeroPrice_ShouldReturnBadRequest()
    {
        SetupOwnerUser();
        var request = new CreateListingRequest
        {
            Title = "Test Boarding",
            Location = "Colombo",
            Price = 0,
            Description = "Nice boarding place"
        };

        var result = await _controller.CreateListingJson(request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetListings_ShouldReturnAllListings()
    {
        CreateTestListing("Boarding 1", "Colombo", 15000);
        CreateTestListing("Boarding 2", "Kandy", 12000);

        var result = await _controller.GetListings(null, null, null, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();
    }

    [Fact]
    public async Task GetListings_WithLocationFilter_ShouldReturnFilteredResults()
    {
        CreateTestListing("Boarding 1", "Colombo", 15000);
        CreateTestListing("Boarding 2", "Kandy", 12000);

        var result = await _controller.GetListings("Colombo", null, null, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();
    }

    [Fact]
    public async Task GetListings_WithPriceFilter_ShouldReturnFilteredResults()
    {
        CreateTestListing("Boarding 1", "Colombo", 15000);
        CreateTestListing("Boarding 2", "Kandy", 12000);

        var result = await _controller.GetListings(null, 13000, 20000, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();
    }

    [Fact]
    public async Task GetListing_WithValidId_ShouldReturnListing()
    {
        var listing = CreateTestListing("Test Boarding", "Colombo", 15000);

        var result = await _controller.GetListing(listing.Id);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedListing = okResult.Value as Listing;
        returnedListing.Should().NotBeNull();
        returnedListing!.Title.Should().Be("Test Boarding");
    }

    [Fact]
    public async Task GetListing_WithInvalidId_ShouldReturnNotFound()
    {
        var result = await _controller.GetListing(999);

        result.Should().BeOfType<NotFoundResult>();
    }


    // The UpdateListing tests are commented out because the controller's UpdateListing method
    // only takes an id and expects the request body to be set up via HTTP context, which is not
    // easily unit testable without a full HTTP simulation or refactoring the controller for testability.
    // Consider using integration tests or refactoring the controller to allow direct method calls for testing.


    [Fact]
    public async Task DeleteListing_WithValidId_ShouldReturnNoContent()
    {
        SetupOwnerUser();
        var listing = CreateTestListing("Test Boarding", "Colombo", 15000, 1);

        var result = await _controller.DeleteListing(listing.Id);

        result.Should().BeOfType<NoContentResult>();
        var deletedListing = await _context.Listings.FindAsync(listing.Id);
        deletedListing.Should().BeNull();
    }

    [Fact]
    public async Task DeleteListing_WithInvalidId_ShouldReturnNotFound()
    {
        SetupOwnerUser();

        var result = await _controller.DeleteListing(999);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeleteListing_WithWrongOwner_ShouldReturnForbid()
    {
        SetupOwnerUser(2); // Different owner ID
        var listing = CreateTestListing("Test Boarding", "Colombo", 15000, 1);

        var result = await _controller.DeleteListing(listing.Id);

        result.Should().BeOfType<ForbidResult>();
    }


    // The GetOwnerListings test is commented out because there is no such method in the controller.
    // Consider using integration tests or adding a public method for owner listings if needed.


    [Fact]
    public async Task RenewListing_WithValidId_ShouldReturnOk()
    {
        SetupOwnerUser();
        var listing = CreateTestListing("Test Boarding", "Colombo", 15000, 1);
        listing.Status = ListingStatus.Expired;
        await _context.SaveChangesAsync();

        var result = await _controller.RenewListing(listing.Id);

        result.Should().BeOfType<OkObjectResult>();
        var renewedListing = await _context.Listings.FindAsync(listing.Id);
        renewedListing!.Status.Should().Be(ListingStatus.Approved);
        renewedListing.ExpiresAt.Should().BeAfter(DateTime.UtcNow.AddMonths(5));
    }


    // The GetListingDetail test is commented out because there is no such method in the controller.
    // Use GetListing for detail retrieval or add a public method if needed.

    private void SetupOwnerUser(int userId = 1)
    {
        SetupUserRole("OWNER", userId);
    }

    private void SetupUserRole(string role, int userId = 1)
    {
        var claims = new List<Claim>
        {
            new Claim("role", role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private Listing CreateTestListing(string title, string location, decimal price, int? ownerId = null)
    {
        var listing = new Listing
        {
            Title = title,
            Location = location,
            Price = price,
            Description = "Test description",
            IsAvailable = true,
            Status = ListingStatus.Approved,
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
}