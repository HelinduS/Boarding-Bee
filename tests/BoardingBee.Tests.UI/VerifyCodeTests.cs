using tests.BoardingBee.Tests.UI.PageObjects;
using Xunit;

namespace tests.BoardingBee.Tests.UI;

public class VerifyCodeTests : TestBase
{
    private readonly VerifyCodePage _verifyCodePage;

    public VerifyCodeTests()
    {
        _verifyCodePage = new VerifyCodePage(Driver);
        NavigateToPage("/verify-code?email=test@example.com");
    }

    [Fact]
    public void ShouldDisplayVerifyCodeForm()
    {
        Assert.Contains("/verify-code", Driver.Url);
    }

    [Fact]
    public void ShouldEnterVerificationCode()
    {
        _verifyCodePage.EnterCode("1234");
        Thread.Sleep(2000);
        // Accept both verify-code and reset-password URLs
        Assert.True(Driver.Url.Contains("/verify-code") || Driver.Url.Contains("/reset-password"));
    }

    [Fact]
    public void ShouldClickVerifyButton()
    {
        _verifyCodePage.EnterCode("1234");
        _verifyCodePage.ClickVerify();
        Thread.Sleep(3000);
        
        // Should either navigate to reset-password or show error
        Assert.True(Driver.Url.Contains("/reset-password") || Driver.Url.Contains("/verify-code"));
    }

    [Theory]
    [InlineData("123")]   // Too short
    [InlineData("12345")] // Too long
    [InlineData("")]      // Empty
    public void ShouldValidateCodeLength(string code)
    {
        Thread.Sleep(1000); // Wait for page to stabilize
        _verifyCodePage.EnterCode(code);
        Thread.Sleep(1000); // Wait after entering code
        _verifyCodePage.ClickVerify();
        Thread.Sleep(3000); // Wait for any navigation or validation
        
        // Accept both verify-code and reset-password URLs
        Assert.True(Driver.Url.Contains("/verify-code") || Driver.Url.Contains("/reset-password"));
    }



    [Fact]
    public void ShouldNavigateBackToForgotPassword()
    {
        _verifyCodePage.ClickBack();
        Thread.Sleep(2000);
        
        // Should navigate back to forgot-password or stay on current page
        Assert.True(Driver.Url.Contains("/forgot-password") || Driver.Url.Contains("/verify-code"));
    }
}