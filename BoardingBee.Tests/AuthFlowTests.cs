using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Xunit;

namespace BoardingBee.Tests;

public class AuthFlowTests : IClassFixture<TestWebAppFactory>   // ✅ no <Program>
{
    private readonly HttpClient _client;
    public AuthFlowTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Login_With_Invalid_Credentials_Should_401()
    {
        var body = new { Username = "wrong", Password = "nope" };
        var res = await _client.PostAsJsonAsync("/api/Auth/login", body); // adjust path if needed
        res.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }
}
