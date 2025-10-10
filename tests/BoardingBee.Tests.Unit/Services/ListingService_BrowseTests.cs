
        using System;
        using System.Threading.Tasks;
        using FluentAssertions;
        using Microsoft.EntityFrameworkCore;
        using Xunit;
        using Moq;
        using Microsoft.AspNetCore.Hosting;
        using Microsoft.AspNetCore.Http;
using BoardingBee_backend.Models;
        using BoardingBee_backend.Services;

namespace BoardingBee.Tests.Unit.Services
{
    public class ListingService_BrowseTests
    {
        private AppDbContext GetInMemoryDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task CreateListingAsync_SuccessfulCreation_ReturnsSuccessAndListingId()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetInMemoryDbContext(dbName);
            var envMock = new Mock<IWebHostEnvironment>();
            envMock.Setup(e => e.WebRootPath).Returns((string)null); // fallback to default
            var service = new ListingService(context, envMock.Object);

            var imagesMock = new Mock<IFormFileCollection>();
            imagesMock.Setup(i => i.GetEnumerator()).Returns(new System.Collections.Generic.List<IFormFile>().GetEnumerator());
            imagesMock.Setup(i => i.Count).Returns(0);

            // Act
            var result = await service.CreateListingAsync(
                ownerId: 1,
                title: "Test Listing",
                location: "Test Location",
                price: 100.0m,
                description: "Test Description",
                facilities: "WiFi, AC",
                isAvailable: true,
                images: imagesMock.Object
            );

            // Assert
            result.Success.Should().BeTrue();
            result.ListingId.Should().NotBeNull();
            context.Listings.Find(result.ListingId).Should().NotBeNull();
        }

        [Fact]
        public async Task BrowseListingsAsync_ReturnsFilteredAndPaginatedResults()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetInMemoryDbContext(dbName);
            var envMock = new Mock<IWebHostEnvironment>();
            var service = new ListingService(context, envMock.Object);
            context.Listings.AddRange(
                new Listing { Title = "A", Location = "Colombo", Price = 100, CreatedAt = DateTime.UtcNow },
                new Listing { Title = "B", Location = "Kandy", Price = 200, CreatedAt = DateTime.UtcNow.AddMinutes(-1) },
                new Listing { Title = "C", Location = "Colombo", Price = 300, CreatedAt = DateTime.UtcNow.AddMinutes(-2) }
            );
            context.SaveChanges();

            // Act
            var (total, listings) = await service.BrowseListingsAsync("Colombo", 50, 250, 1, 10);

            // Assert
            total.Should().Be(1);
            listings.Should().ContainSingle(l => l.Title == "A");
        }

        [Fact]
        public async Task GetListingAsync_ReturnsListingOrNull()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetInMemoryDbContext(dbName);
            var envMock = new Mock<IWebHostEnvironment>();
            var service = new ListingService(context, envMock.Object);
            var listing = new Listing { Title = "Test", Location = "X", Price = 1, CreatedAt = DateTime.UtcNow };
            context.Listings.Add(listing);
            context.SaveChanges();

            // Act
            var found = await service.GetListingAsync(listing.Id);
            var notFound = await service.GetListingAsync(9999);

            // Assert
            found.Should().NotBeNull();
            notFound.Should().BeNull();
        }

        [Fact]
        public async Task UpdateListingAsync_UpdatesListingFields()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetInMemoryDbContext(dbName);
            var envMock = new Mock<IWebHostEnvironment>();
            var service = new ListingService(context, envMock.Object);
            var listing = new Listing { Title = "Old", Location = "Y", Price = 1, CreatedAt = DateTime.UtcNow };
            context.Listings.Add(listing);
            context.SaveChanges();

            // Act
            var result = await service.UpdateListingAsync(listing.Id, l => l.Title = "New");

            // Assert
            result.Success.Should().BeTrue();
            context.Listings.Find(listing.Id)?.Title.Should().Be("New");
        }

        [Fact]
        public async Task DeleteListingAsync_DeletesListingWithCorrectRole()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetInMemoryDbContext(dbName);
            var envMock = new Mock<IWebHostEnvironment>();
            var service = new ListingService(context, envMock.Object);
            var listing = new Listing { Title = "Del", Location = "Z", Price = 1, OwnerId = 42, CreatedAt = DateTime.UtcNow };
            context.Listings.Add(listing);
            context.SaveChanges();

            // Act
            var fail = await service.DeleteListingAsync(listing.Id, 99, "OWNER");
            var success = await service.DeleteListingAsync(listing.Id, 42, "OWNER");

            // Assert
            fail.Success.Should().BeFalse();
            success.Success.Should().BeTrue();
            context.Listings.Find(listing.Id).Should().BeNull();
        }
    }
}

