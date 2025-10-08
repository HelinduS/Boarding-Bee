<<<<<<< HEAD
using Xunit;
using FluentAssertions;
using Moq;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Auth.Services;
using BoardingBee_backend.Models;

namespace BoardingBee.Tests.Unit.Services;

public class AuthServiceTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void HashPassword_ShouldReturnHashedPassword()
    {
        using var context = GetInMemoryContext();
        var authService = new AuthService(context);

        var password = "TestPassword123!";
        var hashedPassword = authService.HashPassword(password);

        hashedPassword.Should().NotBeNullOrEmpty();
        hashedPassword.Should().NotBe(password);
    }

    [Fact]
    public void VerifyPassword_WithCorrectPassword_ShouldReturnTrue()
    {
        using var context = GetInMemoryContext();
        var authService = new AuthService(context);
        var password = "TestPassword123!";
        var hashedPassword = authService.HashPassword(password);

        var result = authService.VerifyPassword(password, hashedPassword);

        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_WithIncorrectPassword_ShouldReturnFalse()
    {
        using var context = GetInMemoryContext();
        var authService = new AuthService(context);
        var password = "TestPassword123!";
        var wrongPassword = "WrongPassword123!";
        var hashedPassword = authService.HashPassword(password);

        var result = authService.VerifyPassword(wrongPassword, hashedPassword);

        result.Should().BeFalse();
    }



    [Fact]
    public void Authenticate_WithValidCredentials_ShouldReturnUser()
    {
        using var context = GetInMemoryContext();
        var authService = new AuthService(context);
        var password = "TestPassword123!";
        var hashedPassword = authService.HashPassword(password);
        
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = hashedPassword,
            Role = "User",
            FirstName = "Test",
            LastName = "User",
            PermanentAddress = "Test Address",
            Gender = "male",
            EmergencyContact = "123-456-7890",
            UserType = "student",
            InstitutionCompany = "Test University",
            Location = "Test City",
            ProfileImageUrl = string.Empty
        };
        
        context.Users.Add(user);
        context.SaveChanges();

        var result = authService.Authenticate("testuser", password);

        result.Should().NotBeNull();
        result!.Username.Should().Be("testuser");
        result.Email.Should().Be("test@example.com");
    }

    [Fact]
    public void Authenticate_WithEmailAsUsername_ShouldReturnUser()
    {
        using var context = GetInMemoryContext();
        var authService = new AuthService(context);
        var password = "TestPassword123!";
        var hashedPassword = authService.HashPassword(password);
        
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = hashedPassword,
            Role = "User",
            FirstName = "Test",
            LastName = "User",
            PermanentAddress = "Test Address",
            Gender = "male",
            EmergencyContact = "123-456-7890",
            UserType = "student",
            InstitutionCompany = "Test University",
            Location = "Test City",
            ProfileImageUrl = string.Empty
        };
        
        context.Users.Add(user);
        context.SaveChanges();

        var result = authService.Authenticate("test@example.com", password);

        result.Should().NotBeNull();
        result!.Email.Should().Be("test@example.com");
    }

    [Fact]
    public void Authenticate_WithInvalidUsername_ShouldReturnNull()
    {
        using var context = GetInMemoryContext();
        var authService = new AuthService(context);

        var result = authService.Authenticate("nonexistent", "password");

        result.Should().BeNull();
    }

    [Fact]
    public void Authenticate_WithInvalidPassword_ShouldReturnNull()
    {
        using var context = GetInMemoryContext();
        var authService = new AuthService(context);
        var password = "TestPassword123!";
        var hashedPassword = authService.HashPassword(password);
        
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = hashedPassword,
            Role = "User",
            FirstName = "Test",
            LastName = "User",
            PermanentAddress = "Test Address",
            Gender = "male",
            EmergencyContact = "123-456-7890",
            UserType = "student",
            InstitutionCompany = "Test University",
            Location = "Test City",
            ProfileImageUrl = string.Empty
        };
        
        context.Users.Add(user);
        context.SaveChanges();

        var result = authService.Authenticate("testuser", "wrongpassword");

        result.Should().BeNull();
    }
}
=======
using System.Threading.Tasks;
using FluentAssertions;
using BoardingBee_backend.Auth.Services;
using BoardingBee_backend.Models;
using BoardingBee.Tests.Unit.Util;
using Xunit;

namespace BoardingBee.Tests.Unit.Auth;

public class AuthServiceTests
{
    [Fact]
    public void Hash_And_Verify_Should_Work()
    {
        using var db = DbContextFactory.CreateInMemory();
        var sut = new AuthService(db);

        var pwd = "P@ssw0rd!";
        var hash = sut.HashPassword(pwd);

        hash.Should().NotBeNullOrWhiteSpace().And.NotBe(pwd);
        sut.VerifyPassword(pwd, hash).Should().BeTrue();
        sut.VerifyPassword("wrong", hash).Should().BeFalse();
    }

    [Fact]
    public void Authenticate_ByEmail_And_Username_Should_Work()
    {
        using var db = DbContextFactory.CreateInMemory();
        var sut = new AuthService(db);

        var user = new User
        {
            Username = "shenal",
            Email = "user@example.com",
            PasswordHash = sut.HashPassword("abc123")
        };
        db.Users.Add(user);
        db.SaveChanges();

        // by email
        var ok1 = sut.Authenticate("user@example.com", "abc123");
        ok1.Should().NotBeNull();
        ok1!.Id.Should().Be(user.Id);

        // by username
        var ok2 = sut.Authenticate("shenal", "abc123");
        ok2.Should().NotBeNull();
        ok2!.Id.Should().Be(user.Id);

        // wrong password
        sut.Authenticate("shenal", "nope").Should().BeNull();

        // unknown user
        sut.Authenticate("ghost", "abc123").Should().BeNull();
    }
}
>>>>>>> 208e7ffa2a8088bb1338da5adbc7a40ebd193c85
