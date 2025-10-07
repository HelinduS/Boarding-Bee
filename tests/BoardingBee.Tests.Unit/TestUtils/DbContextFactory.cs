using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using BoardingBee_backend.Models;

namespace BoardingBee.Tests.Unit.Util;

public static class DbContextFactory
{
    public static AppDbContext CreateInMemory(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? $"bb_tests_{Guid.NewGuid()}")
            .Options;
        // AppDbContext inherits from DbContext, which implements IDisposable
        return new AppDbContext(options);
    }
}
