
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
    public class ListingService_CreateEditDelete_Browse_Tests
    {
        private AppDbContext GetInMemoryDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task CreateListingAsync_AddsListingToDb()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetInMemoryDbContext(dbName);
            var envMock = new Mock<IWebHostEnvironment>();
            var service = new ListingService(context, envMock.Object);
            var imagesMock = new Mock<IFormFileCollection>();
            imagesMock.Setup(i => i.GetEnumerator()).Returns(new System.Collections.Generic.List<IFormFile>().GetEnumerator());
            imagesMock.Setup(i => i.Count).Returns(0);

            // Act
            var result = await service.CreateListingAsync(1, "Test Listing", "Loc", 10, "Desc", "Fac", true, imagesMock.Object);

            // Assert
            result.Success.Should().BeTrue();
            context.Listings.Should().ContainSingle(l => l.Title == "Test Listing");
        }



    }
}


