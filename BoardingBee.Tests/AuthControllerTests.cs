using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace BoardingBee.Tests;

public class AuthControllerTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    public AuthControllerTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Login_With_Invalid_Credentials_Should_401()
    {
        var body = new { Username = "wrong", Password = "nope" };
        var res = await _client.PostAsJsonAsync("/api/Auth/login", body); // adjust if needed
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
