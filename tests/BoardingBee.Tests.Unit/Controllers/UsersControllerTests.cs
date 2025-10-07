using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Controllers;
using BoardingBee_backend.Controllers.Dto;
using BoardingBee_backend.Models;
using Microsoft.AspNetCore.Http;
using Moq;

namespace tests.BoardingBee.Tests.Unit.Controllers;

public class UsersControllerTests
{
    private AppDbContext GetInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetUsers_ShouldReturnAllUsers()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var users = new List<User>
        {
            new() { Id = 1, Username = "user1", Email = "user1@example.com" },
            new() { Id = 2, Username = "user2", Email = "user2@example.com" }
        };
        context.Users.AddRange(users);
        await context.SaveChangesAsync();

        var controller = new UsersController(context);

        // Act
        var result = await controller.GetUsers();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedUsers = okResult.Value.Should().BeAssignableTo<List<User>>().Subject;
        returnedUsers.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetUser_WithValidId_ShouldReturnUser()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var user = new User { Id = 1, Username = "testuser", Email = "test@example.com" };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var controller = new UsersController(context);

        // Act
        var result = await controller.GetUser(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedUser = okResult.Value.Should().BeAssignableTo<User>().Subject;
        returnedUser.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task GetUser_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var controller = new UsersController(context);

        // Act
        var result = await controller.GetUser(999);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateUser_ShouldCreateAndReturnUser()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var controller = new UsersController(context);
        var user = new User
        {
            Username = "newuser",
            Email = "newuser@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var result = await controller.CreateUser(user);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdUser = createdResult.Value.Should().BeAssignableTo<User>().Subject;
        createdUser.Username.Should().Be("newuser");
        createdUser.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetProfile_WithValidUserId_ShouldReturnProfile()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            Email = "test@example.com",
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
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var controller = new UsersController(context);

        // Act
        var result = await controller.GetProfile(1);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var profile = okResult.Value.Should().BeAssignableTo<ProfileResponse>().Subject;
        profile.UserId.Should().Be(1);
        profile.FirstName.Should().Be("John");
        profile.LastName.Should().Be("Doe");
        profile.EmailAddress.Should().Be("test@example.com");
    }

    [Fact]
    public async Task GetProfile_WithInvalidUserId_ShouldReturnNotFound()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var controller = new UsersController(context);

        // Act
        var result = await controller.GetProfile(999);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdateProfile_WithValidData_ShouldUpdateAndReturnProfile()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var controller = new UsersController(context);
        var updateRequest = new UpdateProfileRequest
        {
            FirstName = "Jane",
            LastName = "Smith",
            PermanentAddress = "456 Oak St",
            Gender = "female",
            EmergencyContact = "John Smith",
            UserType = "working-professional",
            InstitutionCompany = "Tech Corp",
            Location = "New City",
            MobileNumber = "9876543210",
            EmailAddress = "jane@example.com"
        };

        // Act
        var result = await controller.UpdateProfile(1, updateRequest);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var profile = okResult.Value.Should().BeAssignableTo<ProfileResponse>().Subject;
        profile.FirstName.Should().Be("Jane");
        profile.LastName.Should().Be("Smith");
        profile.EmailAddress.Should().Be("jane@example.com");
        profile.MobileNumber.Should().Be("9876543210");

        // Verify database was updated
        var updatedUser = await context.Users.FindAsync(1);
        updatedUser!.FirstName.Should().Be("Jane");
        updatedUser.Email.Should().Be("jane@example.com");
    }

    [Fact]
    public async Task UpdateProfile_WithInvalidUserId_ShouldReturnNotFound()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var controller = new UsersController(context);
        var updateRequest = new UpdateProfileRequest { FirstName = "Jane" };

        // Act
        var result = await controller.UpdateProfile(999, updateRequest);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdateSettings_WithValidData_ShouldUpdateSettings()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var user = new User { Id = 1, Username = "testuser", Email = "test@example.com" };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var controller = new UsersController(context);
        var settingsRequest = new UpdateSettingsRequest
        {
            EmailNotifications = true,
            SmsNotifications = false,
            ProfileVisibility = true,
            ShowContactInfo = true
        };

        // Act
        var result = await controller.UpdateSettings(1, settingsRequest);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var profile = okResult.Value.Should().BeAssignableTo<ProfileResponse>().Subject;
        profile.EmailNotifications.Should().BeTrue();
        profile.SmsNotifications.Should().BeFalse();
        profile.ProfileVisibility.Should().BeTrue();
        profile.ShowContactInfo.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateSettings_WithInvalidUserId_ShouldReturnNotFound()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var controller = new UsersController(context);
        var settingsRequest = new UpdateSettingsRequest();

        // Act
        var result = await controller.UpdateSettings(999, settingsRequest);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }



    [Fact]
    public async Task UploadAvatar_WithInvalidUserId_ShouldReturnNotFound()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var controller = new UsersController(context);
        var mockFile = new Mock<IFormFile>();

        // Act
        var result = await controller.UploadAvatar(999, mockFile.Object);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UploadAvatar_WithNullFile_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = GetInMemoryContext();
        var user = new User { Id = 1, Username = "testuser", Email = "test@example.com" };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var controller = new UsersController(context);

        // Act
        var result = await controller.UploadAvatar(1, null!);

        // Assert
        var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().Be("No file uploaded");
    }
}