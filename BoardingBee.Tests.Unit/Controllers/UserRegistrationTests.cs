using Xunit;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Auth.Controllers;
using BoardingBee_backend.Auth.Services;
using BoardingBee_backend.Models;
using System;

namespace BoardingBee.Tests.Unit.Controllers;

public class UserRegistrationTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;
    private readonly AuthController _controller;

    public UserRegistrationTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _authService = new AuthService(_context);
        _controller = new AuthController(_authService);
    }

    [Fact]
    public async Task Register_WithValidData_ShouldReturnOk()
    {
        var request = new AuthController.RegisterRequest
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123",
            FirstName = "Test",
            LastName = "User",
            PermanentAddress = "123 Test St",
            Gender = "male",
            EmergencyContact = "555-0123",
            UserType = "student",
            InstitutionCompany = "Test University",
            Location = "Test City"
        };

        var result = await _controller.Register(request, _context);

        result.Should().BeOfType<OkObjectResult>();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "testuser");
        user.Should().NotBeNull();
        user!.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task Register_WithEmptyUsername_ShouldReturnBadRequest()
    {
        var request = new AuthController.RegisterRequest
        {
            Username = "",
            Email = "test@example.com",
            Password = "password123"
        };

        var result = await _controller.Register(request, _context);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_WithEmptyPassword_ShouldReturnBadRequest()
    {
        var request = new AuthController.RegisterRequest
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = ""
        };

        var result = await _controller.Register(request, _context);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_WithDuplicateUsername_ShouldReturnBadRequest()
    {
        var firstRequest = new AuthController.RegisterRequest
        {
            Username = "testuser",
            Email = "first@example.com",
            Password = "password123"
        };

        var secondRequest = new AuthController.RegisterRequest
        {
            Username = "testuser",
            Email = "second@example.com",
            Password = "password123"
        };

        await _controller.Register(firstRequest, _context);
        var result = await _controller.Register(secondRequest, _context);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturnBadRequest()
    {
        var firstRequest = new AuthController.RegisterRequest
        {
            Username = "user1",
            Email = "test@example.com",
            Password = "password123"
        };

        var secondRequest = new AuthController.RegisterRequest
        {
            Username = "user2",
            Email = "test@example.com",
            Password = "password123"
        };

        await _controller.Register(firstRequest, _context);
        var result = await _controller.Register(secondRequest, _context);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_ShouldHashPassword()
    {
        var request = new AuthController.RegisterRequest
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        };

        await _controller.Register(request, _context);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "testuser");
        user!.PasswordHash.Should().NotBe("password123");
        user.PasswordHash.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_ShouldSetDefaultRole()
    {
        var request = new AuthController.RegisterRequest
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        };

        await _controller.Register(request, _context);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "testuser");
        user!.Role.Should().Be("User");
    }

    [Fact]
    public async Task Register_ShouldSetCreatedAndUpdatedDates()
    {
        var request = new AuthController.RegisterRequest
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        };

        var beforeRegistration = DateTime.UtcNow;
        await _controller.Register(request, _context);
        var afterRegistration = DateTime.UtcNow;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "testuser");
        user!.CreatedAt.Should().BeAfter(beforeRegistration.AddSeconds(-1));
        user.CreatedAt.Should().BeBefore(afterRegistration.AddSeconds(1));
        user.UpdatedAt.Should().BeAfter(beforeRegistration.AddSeconds(-1));
        user.UpdatedAt.Should().BeBefore(afterRegistration.AddSeconds(1));
    }

    [Fact]
    public async Task Register_WithOptionalFields_ShouldStoreAllData()
    {
        var request = new AuthController.RegisterRequest
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123",
            PhoneNumber = "555-0123",
            FirstName = "John",
            LastName = "Doe",
            PermanentAddress = "123 Main St",
            Gender = "male",
            EmergencyContact = "555-9999",
            UserType = "student",
            InstitutionCompany = "University",
            Location = "City"
        };

        await _controller.Register(request, _context);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "testuser");
        user!.PhoneNumber.Should().Be("555-0123");
        user.FirstName.Should().Be("John");
        user.LastName.Should().Be("Doe");
        user.PermanentAddress.Should().Be("123 Main St");
        user.Gender.Should().Be("male");
        user.EmergencyContact.Should().Be("555-9999");
        user.UserType.Should().Be("student");
        user.InstitutionCompany.Should().Be("University");
        user.Location.Should().Be("City");
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}