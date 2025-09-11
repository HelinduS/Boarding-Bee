using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using Xunit;

namespace BoardingBee.Tests;

public class AvatarUploadTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;
    public AvatarUploadTests(TestWebAppFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Upload_Avatar_Should_Return_Updated_Profile()
    {
        var content = new MultipartFormDataContent();
        var bytes = new byte[] { 1, 2, 3, 4, 5 }; // fake image data
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "file", "avatar.png");

        var res = await _client.PostAsync("/api/Users/1/profile/avatar", content);
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        // Optionally parse ProfileResponse and assert ProfileImage not empty
    }
}
