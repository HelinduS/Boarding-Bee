using BoardingBee.Tests.PageObjects;
using Xunit;

namespace BoardingBee.Tests;

public class LoginTests : TestBase
{
    private readonly LoginPage _loginPage;

    public LoginTests()
    {
        _loginPage = new LoginPage(Driver);
        NavigateToPage("/login");
    }

    [Fact]
    public void ShouldLoginWithValidCredentials()
    {
        // Replace with test user credentials
        _loginPage.Login("test@example.com", "Test123!");
        
        // Add assertions based on successful login indicators
        // For example: verify redirect to dashboard or presence of user-specific elements
        Assert.Equal($"{BaseUrl}/dashboard", Driver.Url);
    }

    [Fact]
    public void ShouldShowErrorWithInvalidCredentials()
    {
        _loginPage.Login("invalid@example.com", "wrongpassword");
        Assert.True(_loginPage.IsErrorMessageDisplayed());
    }

    [Theory]
    [InlineData("", "password", "Email is required")]
    [InlineData("invalid-email", "password", "Invalid email format")]
    [InlineData("test@example.com", "", "Password is required")]
    public void ShouldShowValidationErrors(string email, string password, string expectedError)
    {
        if (!string.IsNullOrEmpty(email))
            _loginPage.EnterEmail(email);
        
        if (!string.IsNullOrEmpty(password))
            _loginPage.EnterPassword(password);
        
        _loginPage.ClickLoginButton();
        Assert.True(_loginPage.IsErrorMessageDisplayed());
    }

    [Fact]
    public void ShouldNavigateToForgotPassword()
    {
        _loginPage.ClickForgotPassword();
        Assert.Equal($"{BaseUrl}/forgot-password", Driver.Url);
    }

    [Fact]
    public void ShouldNavigateToRegister()
    {
        _loginPage.ClickRegister();
        Assert.Equal($"{BaseUrl}/register", Driver.Url);
    }
}