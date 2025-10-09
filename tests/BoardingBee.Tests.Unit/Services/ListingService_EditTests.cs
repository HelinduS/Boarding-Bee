
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
	public class ListingService_EditTests
	{
		private AppDbContext GetInMemoryDbContext(string dbName)
		{
			var options = new DbContextOptionsBuilder<AppDbContext>()
				.UseInMemoryDatabase(databaseName: dbName)
				.Options;
			return new AppDbContext(options);
		}

		// No EditListingAsync method exists; update tests if/when such a method is added to the service.
		// This file is now intentionally left empty.
	}
}
