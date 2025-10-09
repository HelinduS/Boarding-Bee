using System;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;

namespace BoardingBee.Tests.Unit.Util;

public static class DbContextFactory
{
    public static AppDbContext CreateInMemory(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? $"bb_tests_{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
