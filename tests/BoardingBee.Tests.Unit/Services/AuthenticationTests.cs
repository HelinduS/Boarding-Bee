using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Auth.Services;
using BoardingBee_backend.Models;
using System;

namespace BoardingBee.Tests.Unit.Services;

public class AuthenticationTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;

    public AuthenticationTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _authService = new AuthService(_context);
    }

    [Fact]
    public void Authenticate_WithValidUsernameAndPassword_ShouldReturnUser()
    {
        var user = CreateTestUser("testuser", "test@example.com", "password123");

        var result = _authService.Authenticate("testuser", "password123");

        result.Should().NotBeNull();
        result!.Username.Should().Be("testuser");
        result.Email.Should().Be("test@example.com");
    }

    [Fact]
    public void Authenticate_WithValidEmailAndPassword_ShouldReturnUser()
    {
        var user = CreateTestUser("testuser", "test@example.com", "password123");

        var result = _authService.Authenticate("test@example.com", "password123");

        result.Should().NotBeNull();
        result!.Username.Should().Be("testuser");
        result.Email.Should().Be("test@example.com");
    }

    [Fact]
    public void Authenticate_WithInvalidUsername_ShouldReturnNull()
    {
        var user = CreateTestUser("testuser", "test@example.com", "password123");

        var result = _authService.Authenticate("wronguser", "password123");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithInvalidPassword_ShouldReturnNull()
    {
        var user = CreateTestUser("testuser", "test@example.com", "password123");

        var result = _authService.Authenticate("testuser", "wrongpassword");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithNullUsername_ShouldReturnNull()
    {
        var result = _authService.Authenticate(null!, "password123");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithNullPassword_ShouldReturnNull()
    {
        var result = _authService.Authenticate("testuser", null!);

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithEmptyUsername_ShouldReturnNull()
    {
        var result = _authService.Authenticate("", "password123");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithEmptyPassword_ShouldReturnNull()
    {
        var result = _authService.Authenticate("testuser", "");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithWhitespaceCredentials_ShouldReturnNull()
    {
        var result1 = _authService.Authenticate("   ", "password123");
        var result2 = _authService.Authenticate("testuser", "   ");

        result1.Should().BeNull();
        result2.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithMultipleUsersWithSameEmail_ShouldReturnFirst()
    {
        var user1 = CreateTestUser("user1", "shared@example.com", "password123");
        var user2 = CreateTestUser("user2", "shared@example.com", "password123");

        var result = _authService.Authenticate("shared@example.com", "password123");

        result.Should().NotBeNull();
        result!.Username.Should().Be("user1");
    }

    [Fact]
    public void Authenticate_WithSpecialCharactersInCredentials_ShouldWork()
    {
        var user = CreateTestUser("user@domain.com", "test+tag@example.com", "P@ssw0rd!#$%");

        var result = _authService.Authenticate("user@domain.com", "P@ssw0rd!#$%");

        result.Should().NotBeNull();
        result!.Username.Should().Be("user@domain.com");
    }

    [Fact]
    public void Authenticate_WithUnicodeCharacters_ShouldWork()
    {
        var user = CreateTestUser("пользователь", "тест@пример.рф", "пароль123");

        var result = _authService.Authenticate("пользователь", "пароль123");

        result.Should().NotBeNull();
        result!.Username.Should().Be("пользователь");
    }

    [Fact]
    public void Authenticate_WithLongCredentials_ShouldWork()
    {
        var longUsername = new string('a', 100);
        var longPassword = new string('b', 200);
        var user = CreateTestUser(longUsername, "test@example.com", longPassword);

        var result = _authService.Authenticate(longUsername, longPassword);

        result.Should().NotBeNull();
        result!.Username.Should().Be(longUsername);
    }

    [Fact]
    public void Authenticate_WithDeletedUser_ShouldReturnNull()
    {
        var user = CreateTestUser("testuser", "test@example.com", "password123");
        _context.Users.Remove(user);
        _context.SaveChanges();

        var result = _authService.Authenticate("testuser", "password123");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_ShouldNotReturnPasswordHash()
    {
        var user = CreateTestUser("testuser", "test@example.com", "password123");

        var result = _authService.Authenticate("testuser", "password123");

        result.Should().NotBeNull();
        result!.PasswordHash.Should().NotBe("password123");
        result.PasswordHash.Should().NotBeNullOrEmpty();
    }

    private User CreateTestUser(string username, string email, string password)
    {
        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = _authService.HashPassword(password),
            Role = "User",
            FirstName = "Test",
            LastName = "User",
            PermanentAddress = "Address",
            Gender = "male",
            EmergencyContact = "123-456-7890",
            UserType = "student",
            InstitutionCompany = "University",
            Location = "City",
            ProfileImageUrl = string.Empty
        };

        _context.Users.Add(user);
        _context.SaveChanges();
        return user;
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}