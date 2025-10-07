using Xunit;
using FluentAssertions;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Auth.Controllers;
using BoardingBee_backend.Auth.Services;
using BoardingBee_backend.Models;

namespace tests.BoardingBee.Tests.Unit.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _mockAuthService;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockAuthService = new Mock<IAuthService>();
        _controller = new AuthController(_mockAuthService.Object);
    }

    [Fact]
    public void Login_WithValidCredentials_ShouldReturnOkWithToken()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "testuser",
            Password = "password123"
        };
        var user = new User { Id = 1, Username = "testuser", Role = "USER" };
        var token = "jwt-token";

        _mockAuthService.Setup(x => x.Authenticate(request.Username, request.Password))
            .Returns(user);
        _mockAuthService.Setup(x => x.GenerateJwtToken(user))
            .Returns(token);

        // Act
        var result = _controller.Login(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();
        response!.GetType().GetProperty("token")!.GetValue(response).Should().Be(token);
        response.GetType().GetProperty("role")!.GetValue(response).Should().Be("USER");
    }

    [Fact]
    public void Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "testuser",
            Password = "wrongpassword"
        };

        _mockAuthService.Setup(x => x.Authenticate(request.Username, request.Password))
            .Returns((User?)null);

        // Act
        var result = _controller.Login(request);

        // Assert
        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public void Login_WithEmptyUsername_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "",
            Password = "password123"
        };

        // Act
        var result = _controller.Login(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().Be("Username and password are required.");
    }

    [Fact]
    public void Login_WithEmptyPassword_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "testuser",
            Password = ""
        };

        // Act
        var result = _controller.Login(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().Be("Username and password are required.");
    }

    [Fact]
    public async Task Register_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);

        var request = new AuthController.RegisterRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
            Password = "password123",
            FirstName = "John",
            LastName = "Doe",
            PhoneNumber = "1234567890",
            PermanentAddress = "123 Main St",
            Gender = "male",
            EmergencyContact = "Jane Doe",
            UserType = "student",
            InstitutionCompany = "University",
            Location = "City"
        };

        _mockAuthService.Setup(x => x.HashPassword(request.Password))
            .Returns("hashed-password");

        // Act
        var result = await _controller.Register(request, context);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();
        response!.GetType().GetProperty("message")!.GetValue(response).Should().Be("Registration successful.");

        var user = await context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        user.Should().NotBeNull();
        user!.Email.Should().Be(request.Email);
        user.FirstName.Should().Be(request.FirstName);
    }

    [Fact]
    public async Task Register_WithEmptyUsername_ShouldReturnBadRequest()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);

        var request = new AuthController.RegisterRequest
        {
            Username = "",
            Email = "test@example.com",
            Password = "password123"
        };

        // Act
        var result = await _controller.Register(request, context);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value;
        response!.GetType().GetProperty("message")!.GetValue(response).Should().Be("Username and password are required.");
    }

    [Fact]
    public async Task Register_WithExistingUsername_ShouldReturnBadRequest()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);

        // Add existing user
        context.Users.Add(new User { Username = "existinguser", Email = "existing@example.com" });
        await context.SaveChangesAsync();

        var request = new AuthController.RegisterRequest
        {
            Username = "existinguser",
            Email = "new@example.com",
            Password = "password123"
        };

        // Act
        var result = await _controller.Register(request, context);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value;
        response!.GetType().GetProperty("message")!.GetValue(response).Should().Be("Username or email already exists.");
    }

    [Fact]
    public async Task Register_WithExistingEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var context = new AppDbContext(options);

        // Add existing user
        context.Users.Add(new User { Username = "user1", Email = "existing@example.com" });
        await context.SaveChangesAsync();

        var request = new AuthController.RegisterRequest
        {
            Username = "newuser",
            Email = "existing@example.com",
            Password = "password123"
        };

        // Act
        var result = await _controller.Register(request, context);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value;
        response!.GetType().GetProperty("message")!.GetValue(response).Should().Be("Username or email already exists.");
    }
}