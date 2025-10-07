using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.controllers;
using BoardingBee_backend.Controllers.Dto;
using BoardingBee_backend.models;
using BoardingBee_backend.Models;

namespace tests.BoardingBee.Tests.Unit.Controllers;

public class BrowseListingsTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private Listing CreateTestListing(string title, string location, decimal price, bool isAvailable = true, ListingStatus status = ListingStatus.Approved)
    {
        return new Listing
        {
            Title = title,
            Location = location,
            Price = price,
            IsAvailable = isAvailable,
            Status = status,
            Description = $"Description for {title}",
            CreatedAt = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMonths(6),
            ThumbnailUrl = "/default-image.jpg"
        };
    }

    [Fact]
    public async Task BrowseListings_ShouldReturnAllAvailableListings()
    {
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            CreateTestListing("Cozy Room in Colombo", "Colombo", 15000),
            CreateTestListing("Modern Apartment", "Kandy", 25000),
            CreateTestListing("Budget Room", "Galle", 8000),
            CreateTestListing("Luxury Suite", "Negombo", 35000)
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings(null, null, null, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(4);
    }

    [Fact]
    public async Task BrowseListings_WithLocationSearch_ShouldReturnMatchingListings()
    {
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            CreateTestListing("Room in Colombo 1", "Colombo", 15000),
            CreateTestListing("Room in Colombo 2", "Colombo", 18000),
            CreateTestListing("Room in Kandy", "Kandy", 12000),
            CreateTestListing("Room in Galle", "Galle", 10000)
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings("Colombo", null, null, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(2);
    }

    [Fact]
    public async Task BrowseListings_WithMinPriceFilter_ShouldReturnListingsAboveMinPrice()
    {
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            CreateTestListing("Budget Room", "Colombo", 8000),
            CreateTestListing("Standard Room", "Colombo", 15000),
            CreateTestListing("Premium Room", "Colombo", 25000),
            CreateTestListing("Luxury Room", "Colombo", 35000)
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings(null, 20000, null, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(2);
    }

    [Fact]
    public async Task BrowseListings_WithMaxPriceFilter_ShouldReturnListingsBelowMaxPrice()
    {
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            CreateTestListing("Budget Room", "Colombo", 8000),
            CreateTestListing("Standard Room", "Colombo", 15000),
            CreateTestListing("Premium Room", "Colombo", 25000),
            CreateTestListing("Luxury Room", "Colombo", 35000)
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings(null, null, 20000, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(2);
    }

    [Fact]
    public async Task BrowseListings_WithPriceRange_ShouldReturnListingsInRange()
    {
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            CreateTestListing("Budget Room", "Colombo", 8000),
            CreateTestListing("Standard Room 1", "Colombo", 15000),
            CreateTestListing("Standard Room 2", "Colombo", 18000),
            CreateTestListing("Premium Room", "Colombo", 25000),
            CreateTestListing("Luxury Room", "Colombo", 35000)
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings(null, 12000, 20000, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(2);
    }

    [Fact]
    public async Task BrowseListings_WithLocationAndPriceFilters_ShouldReturnMatchingListings()
    {
        using var context = GetInMemoryContext();
        var listings = new List<Listing>
        {
            CreateTestListing("Cheap Colombo Room", "Colombo", 10000),
            CreateTestListing("Expensive Colombo Room", "Colombo", 30000),
            CreateTestListing("Cheap Kandy Room", "Kandy", 8000),
            CreateTestListing("Expensive Kandy Room", "Kandy", 25000)
        };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings("Colombo", 15000, null, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        total.Should().Be(1);
    }

    [Fact]
    public async Task BrowseListings_WithPagination_ShouldReturnCorrectPage()
    {
        using var context = GetInMemoryContext();
        var listings = new List<Listing>();
        for (int i = 1; i <= 25; i++)
        {
            listings.Add(CreateTestListing($"Room {i}", "Colombo", 15000 + i * 1000));
        }
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings(null, null, null, 2, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        var listings_prop = response.GetType().GetProperty("listings")!.GetValue(response);
        
        total.Should().Be(25);
        var listingsArray = listings_prop.Should().BeAssignableTo<List<Listing>>().Subject;
        listingsArray.Should().HaveCount(10);
    }

    [Fact]
    public async Task BrowseListings_WithCustomPageSize_ShouldReturnCorrectNumberOfItems()
    {
        using var context = GetInMemoryContext();
        var listings = new List<Listing>();
        for (int i = 1; i <= 20; i++)
        {
            listings.Add(CreateTestListing($"Room {i}", "Colombo", 15000));
        }
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings(null, null, null, 1, 5);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var listings_prop = response!.GetType().GetProperty("listings")!.GetValue(response);
        var listingsArray = listings_prop.Should().BeAssignableTo<List<Listing>>().Subject;
        listingsArray.Should().HaveCount(5);
    }

    [Fact]
    public async Task BrowseListings_ShouldOrderByCreatedDateDescending()
    {
        using var context = GetInMemoryContext();
        var baseTime = DateTime.UtcNow;
        var oldestRoom = CreateTestListing("Oldest Room", "Colombo", 15000);
        oldestRoom.CreatedAt = baseTime.AddDays(-5);
        
        var newestRoom = CreateTestListing("Newest Room", "Colombo", 18000);
        newestRoom.CreatedAt = baseTime;
        
        var middleRoom = CreateTestListing("Middle Room", "Colombo", 16000);
        middleRoom.CreatedAt = baseTime.AddDays(-2);
        
        var listings = new List<Listing> { oldestRoom, newestRoom, middleRoom };
        context.Listings.AddRange(listings);
        await context.SaveChangesAsync();

        var controller = new ListingsController(context);
        var result = await controller.GetListings(null, null, null, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var listings_prop = response!.GetType().GetProperty("listings")!.GetValue(response);
        var listingsArray = listings_prop.Should().BeAssignableTo<List<Listing>>().Subject;
        
        listingsArray.First().Title.Should().Be("Newest Room");
    }

    [Fact]
    public async Task BrowseListings_WithNoResults_ShouldReturnEmptyList()
    {
        using var context = GetInMemoryContext();
        var controller = new ListingsController(context);
        var result = await controller.GetListings(null, null, null, 1, 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        var total = response!.GetType().GetProperty("total")!.GetValue(response);
        var listings_prop = response.GetType().GetProperty("listings")!.GetValue(response);
        
        total.Should().Be(0);
        var listingsArray = listings_prop.Should().BeAssignableTo<List<Listing>>().Subject;
        listingsArray.Should().BeEmpty();
    }


    // The GetListingDetail tests are commented out because there is no such method in the controller.
    // Use GetListing for detail retrieval or add a public method if needed.
}