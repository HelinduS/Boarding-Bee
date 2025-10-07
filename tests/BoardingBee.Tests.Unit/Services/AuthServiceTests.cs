using System.Threading.Tasks;
using FluentAssertions;
using BoardingBee_backend.Auth.Services;
using BoardingBee_backend.Models;
using BoardingBee.Tests.Unit.Util;
using Xunit;

namespace tests.BoardingBee.Tests.Unit.Auth;

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
