using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using BoardingBee_backend.Controllers.Dto;

namespace BoardingBee_backend.Tests;

public class UsersControllerTests : IClassFixture<CustomWebAppFactory>
{
    private readonly CustomWebAppFactory _factory;

    public UsersControllerTests(CustomWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetProfile_ReturnsSeededUser()
    {
        // Arrange
        var userId = await TestDataSeeder.SeedUserAsync(_factory.Services);
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync($"api/users/{userId}/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var profile = await response.Content.ReadFromJsonAsync<ProfileResponse>();
        profile!.EmailAddress.Should().Be("kavi@example.com");
    }

    [Fact]
    public async Task UpdateProfile_ChangesFields()
    {
        var userId = await TestDataSeeder.SeedUserAsync(_factory.Services);
        var client = _factory.CreateClient();

        var update = new UpdateProfileRequest
        {
            FirstName = "Kavi",
            LastName = "K",
            MobileNumber = "0779999999",
            EmailAddress = "kavi+new@example.com"
        };

        var response = await client.PutAsJsonAsync($"api/users/{userId}/profile", update);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var profile = await response.Content.ReadFromJsonAsync<ProfileResponse>();
        profile!.MobileNumber.Should().Be("0779999999");
    }
}
