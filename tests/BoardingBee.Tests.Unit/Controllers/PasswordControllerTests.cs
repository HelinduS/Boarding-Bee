using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.controllers;
using BoardingBee_backend.Models;
using BoardingBee.Tests.Unit.Util;
using Xunit;

namespace BoardingBee.Tests.Unit.Controllers;

public class PasswordControllerTests
{
    private static (AppDbContext db, PasswordController sut, User user) Seed()
    {
        var db = DbContextFactory.CreateInMemory();

        var inMemCfg = new ConfigurationBuilder()
            .AddInMemoryCollection(new[] { new KeyValuePair<string, string?>("Smtp:From", "noreply@example.com") })
            .Build();

        var user = new User
        {
            Email = "u@example.com",
            Username = "user1",
            PasswordHash = "oldhash"
        };
        db.Users.Add(user);
        db.SaveChanges();

        var sut = new PasswordController(db, inMemCfg);
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                Connection = { RemoteIpAddress = IPAddress.Parse("127.0.0.1") }
            }
        };

        return (db, sut, user);
    }

    [Fact]
    public async Task Forgot_Should_Create_New_Token_And_Revoke_Others()
    {
        var (db, sut, user) = Seed();

        // Pre-create an open token
        db.PasswordResetTestTokens.Add(new PasswordResetTestToken
        {
            UserId = user.Id,
            TokenHash = "old",
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        });
        db.SaveChanges();

        var req = new PasswordController.ForgotPasswordRequest { Email = "u@example.com" };
        try
        {
            var result = await sut.Forgot(req);
            (result as OkObjectResult).Should().NotBeNull();
        }
        catch (System.Net.Mail.SmtpException)
        {
            // SMTP not available in test environment; ignore send failure but DB changes are persisted
        }

        var tokens = db.PasswordResetTestTokens.Where(t => t.UserId == user.Id).ToList();
        tokens.Count.Should().Be(2);
        tokens.Count(t => t.IsRevoked).Should().Be(1);
        tokens.Count(t => !t.IsRevoked).Should().Be(1);
    }

    [Fact]
    public async Task Verify_And_Reset_Should_Succeed_For_Correct_Code()
    {
        var (db, sut, user) = Seed();

        // 1) Request code
        try
        {
            var forgotRes = await sut.Forgot(new PasswordController.ForgotPasswordRequest { Email = "u@example.com" });
            forgotRes.Should().BeOfType<OkObjectResult>();
        }
        catch (System.Net.Mail.SmtpException)
        {
            // ignore SMTP failures in CI/local tests
        }

        // We can't see raw code in DB (only hash), so we simulate verify by calling the internal Hash()
        // Strategy: We fetch the last token, and we brute-force a 4-digit code (0000..9999) to find a matching hash only in tests.
        var token = db.PasswordResetTestTokens.OrderByDescending(t => t.CreatedAt).First();
        string matchingCode = null!;
        for (int i = 0; i <= 9999; i++)
        {
            var candidate = i.ToString("0000");
            if (PasswordHash(token, candidate))
            {
                matchingCode = candidate;
                break;
            }
        }
        matchingCode.Should().NotBeNull("should find the matching OTP in test scope");

        // 2) Verify
        var verifyRes = await sut.Verify(new PasswordController.VerifyResetTokenRequest
        {
            Email = "u@example.com",
            Token = matchingCode
        });
        verifyRes.Should().BeOfType<OkObjectResult>();

        // 3) Reset
        var resetRes = await sut.Reset(new PasswordController.ResetPasswordRequest
        {
            Email = "u@example.com",
            Token = matchingCode,
            NewPassword = "NewP@ss123",
            ConfirmPassword = "NewP@ss123"
        });
        resetRes.Should().BeOfType<OkObjectResult>();

        // password should be changed & token used/revoked
        var refreshed = await db.Users.FirstAsync(x => x.Id == user.Id);
        refreshed.PasswordHash.Should().NotBe("oldhash");

        var finalToken = await db.PasswordResetTestTokens.FirstAsync(t => t.Id == token.Id);
        finalToken.UsedAt.Should().NotBeNull();
    }

    // -------- test helper: recompute the same hash as controller for the brute-force ----------
    private static bool PasswordHash(PasswordResetTestToken t, string code)
    {
        // Controller uses SHA256 over UTF8(code), stored hex; we replicate minimal check:
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = System.Text.Encoding.UTF8.GetBytes(code);
        var hash = sha.ComputeHash(bytes);
        var hex = BitConverter.ToString(hash).Replace("-", ""); // uppercase to match controller
        return t.TokenHash == hex && t.ExpiresAt > DateTime.UtcNow && !t.IsRevoked && t.UsedAt == null;
    }
}
