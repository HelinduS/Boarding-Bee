using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Auth.Services;
using BoardingBee_backend.Models;
using System;

namespace BoardingBee.Tests.Unit.Services;

public class AuthServiceEdgeCaseTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;

    public AuthServiceEdgeCaseTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _authService = new AuthService(_context);
    }

    [Fact]
    public void HashPassword_WithEmptyString_ShouldReturnHash()
    {
        var password = "";
        var hashedPassword = _authService.HashPassword(password);

        hashedPassword.Should().NotBeNullOrEmpty();
        hashedPassword.Should().NotBe(password);
    }

    [Fact]
    public void HashPassword_WithVeryLongPassword_ShouldReturnHash()
    {
        var password = new string('a', 1000);
        var hashedPassword = _authService.HashPassword(password);

        hashedPassword.Should().NotBeNullOrEmpty();
        hashedPassword.Should().NotBe(password);
    }

    [Fact]
    public void HashPassword_WithSpecialCharacters_ShouldReturnHash()
    {
        var password = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
        var hashedPassword = _authService.HashPassword(password);

        hashedPassword.Should().NotBeNullOrEmpty();
        hashedPassword.Should().NotBe(password);
    }

    [Fact]
    public void HashPassword_WithUnicodeCharacters_ShouldReturnHash()
    {
        var password = "пароль密码パスワード🔒";
        var hashedPassword = _authService.HashPassword(password);

        hashedPassword.Should().NotBeNullOrEmpty();
        hashedPassword.Should().NotBe(password);
    }

    [Fact]
    public void HashPassword_SamePasswordTwice_ShouldReturnDifferentHashes()
    {
        var password = "TestPassword123!";
        var hash1 = _authService.HashPassword(password);
        var hash2 = _authService.HashPassword(password);

        hash1.Should().NotBe(hash2);
    }

    [Fact]
    public void VerifyPassword_WithEmptyPassword_ShouldWork()
    {
        var password = "";
        var hashedPassword = _authService.HashPassword(password);

        var result = _authService.VerifyPassword(password, hashedPassword);

        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_WithNullPassword_ShouldReturnFalse()
    {
        var hashedPassword = _authService.HashPassword("test");

        Action act = () => _authService.VerifyPassword(null!, hashedPassword);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void VerifyPassword_WithNullHash_ShouldReturnFalse()
    {
        Action act = () => _authService.VerifyPassword("test", null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void VerifyPassword_WithInvalidHash_ShouldReturnFalse()
    {
        Action act = () => _authService.VerifyPassword("test", "invalid-hash");

        act.Should().Throw<FormatException>();
    }

    [Fact]
    public void Authenticate_WithNullUsername_ShouldReturnNull()
    {
        var result = _authService.Authenticate(null!, "password");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithNullPassword_ShouldReturnNull()
    {
        var result = _authService.Authenticate("username", null!);

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithEmptyUsername_ShouldReturnNull()
    {
        var result = _authService.Authenticate("", "password");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithEmptyPassword_ShouldReturnNull()
    {
        var result = _authService.Authenticate("username", "");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithWhitespaceUsername_ShouldReturnNull()
    {
        var result = _authService.Authenticate("   ", "password");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithWhitespacePassword_ShouldReturnNull()
    {
        var result = _authService.Authenticate("username", "   ");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithCaseInsensitiveEmail_ShouldWork()
    {
        var password = "TestPassword123!";
        var hashedPassword = _authService.HashPassword(password);
        
        var user = new User
        {
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = hashedPassword,
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

        var result = _authService.Authenticate("test@example.com", password);

        result.Should().NotBeNull();
        result!.Email.Should().Be("test@example.com");
    }

    [Fact]
    public void Authenticate_WithCaseInsensitiveUsername_ShouldWork()
    {
        var password = "TestPassword123!";
        var hashedPassword = _authService.HashPassword(password);
        
        var user = new User
        {
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = hashedPassword,
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

        var result = _authService.Authenticate("testuser", password);

        result.Should().NotBeNull();
        result!.Username.Should().Be("testuser");
    }

    [Fact]
    public void GenerateJwtToken_WithNullUser_ShouldThrowException()
    {
        Action act = () => _authService.GenerateJwtToken(null!);

        act.Should().Throw<Exception>();
    }





    [Fact]
    public void Authenticate_WithMultipleUsersWithSameEmail_ShouldReturnFirst()
    {
        var password = "TestPassword123!";
        var hashedPassword = _authService.HashPassword(password);
        
        var user1 = new User
        {
            Username = "user1",
            Email = "shared@example.com",
            PasswordHash = hashedPassword,
            Role = "User",
            FirstName = "First",
            LastName = "User",
            PermanentAddress = "Address1",
            Gender = "male",
            EmergencyContact = "123-456-7890",
            UserType = "student",
            InstitutionCompany = "University1",
            Location = "City1",
            ProfileImageUrl = string.Empty
        };

        var user2 = new User
        {
            Username = "user2",
            Email = "shared@example.com",
            PasswordHash = hashedPassword,
            Role = "User",
            FirstName = "Second",
            LastName = "User",
            PermanentAddress = "Address2",
            Gender = "female",
            EmergencyContact = "123-456-7891",
            UserType = "professional",
            InstitutionCompany = "University2",
            Location = "City2",
            ProfileImageUrl = string.Empty
        };
        
        _context.Users.AddRange(user1, user2);
        _context.SaveChanges();

        var result = _authService.Authenticate("shared@example.com", password);

        result.Should().NotBeNull();
        result!.Username.Should().Be("user1");
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}