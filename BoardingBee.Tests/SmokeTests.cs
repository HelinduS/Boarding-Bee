using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace BoardingBee.Tests;

public class SmokeTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    public SmokeTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Any_Public_Endpoint_Should_Return_OK()
    {
        var candidates = new[] { "/api/Users", "/health", "/api/health" }; // adjust to your real endpoints
        var anyOk = false;

        foreach (var path in candidates)
        {
            try
            {
                var res = await _client.GetAsync(path);
                anyOk = anyOk || res.StatusCode == HttpStatusCode.OK;
            }
            catch { /* ignore if endpoint missing */ }
        }

        anyOk.Should().BeTrue("at least one public endpoint should return 200 OK");
    }
}
