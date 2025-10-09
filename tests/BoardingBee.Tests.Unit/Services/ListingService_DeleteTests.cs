
using System;
using System.Threading.Tasks;
using BoardingBee_backend.Services;
using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Moq;
using Microsoft.AspNetCore.Hosting;
using BoardingBee_backend.Models;
using BoardingBee_backend.Services;

namespace BoardingBee.Tests.Unit.Services
{
	public class ListingService_DeleteTests
	{
		private AppDbContext GetInMemoryDbContext(string dbName)
		{
			var options = new DbContextOptionsBuilder<AppDbContext>()
				.UseInMemoryDatabase(databaseName: dbName)
				.Options;
			return new AppDbContext(options);
		}

		[Fact]
		public async Task DeleteListing_NonExistentId_ReturnsNotFound()
		{
			// Arrange
			var dbName = Guid.NewGuid().ToString();
			using var context = GetInMemoryDbContext(dbName);
			var envMock = new Mock<IWebHostEnvironment>();
			var service = new ListingService(context, envMock.Object);

			// Act
			var result = await service.DeleteListingAsync(999, 1, "OWNER");

			// Assert
			result.Success.Should().BeFalse();
			result.Message.Should().Be("Listing not found.");
		}
	}
}

