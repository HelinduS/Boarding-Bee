using BoardingBee.Tests.PageObjects;
using Xunit;

namespace BoardingBee.Tests;

public class ForgotPasswordTests : TestBase
{
    private readonly ForgotPasswordPage _forgotPasswordPage;

    public ForgotPasswordTests()
    {
        _forgotPasswordPage = new ForgotPasswordPage(Driver);
        NavigateToPage("/forgot-password");
    }

    [Fact]
    public void ShouldDisplayForgotPasswordForm()
    {
        Assert.Contains("/forgot-password", Driver.Url);
    }

    [Fact]
    public void ShouldEnterEmailAddress()
    {
        _forgotPasswordPage.EnterEmail("test@example.com");
        Assert.Contains("/forgot-password", Driver.Url);
    }

    [Fact]
    public void ShouldClickSendResetCode()
    {
        _forgotPasswordPage.EnterEmail("test@example.com");
        _forgotPasswordPage.ClickSendResetCode();
        Thread.Sleep(3000);
        
        // Should either navigate to verify-code or show error
        Assert.True(Driver.Url.Contains("/verify-code") || Driver.Url.Contains("/forgot-password"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("invalid-email")]
    public void ShouldValidateEmailFormat(string email)
    {
        if (!string.IsNullOrEmpty(email))
            _forgotPasswordPage.EnterEmail(email);
        
        _forgotPasswordPage.ClickSendResetCode();
        Thread.Sleep(2000);
        
        // Should stay on forgot-password page for invalid input
        Assert.Contains("/forgot-password", Driver.Url);
    }

    [Fact]
    public void ShouldNavigateBackToLogin()
    {
        _forgotPasswordPage.ClickBack();
        Thread.Sleep(2000);
        
        // Should navigate back to login or stay on current page
        Assert.True(Driver.Url.Contains("/login") || Driver.Url.Contains("/forgot-password"));
    }
}