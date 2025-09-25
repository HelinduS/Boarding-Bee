using BoardingBee.Tests.PageObjects;
using Xunit;

namespace BoardingBee.Tests;

public class RegisterTests : TestBase
{
    private readonly RegisterPage _registerPage;

    public RegisterTests()
    {
        _registerPage = new RegisterPage(Driver);
        NavigateToPage("/register");
    }

    [Fact]
    public void ShouldRegisterWithValidInformation()
    {
        var timestamp = DateTime.Now.Ticks;
        var email = $"test{timestamp}@example.com";
        
        _registerPage.Register(email, "Test123!", "John", "Doe");
        
        // Add assertions based on successful registration indicators
        // For example: verify redirect to login page or success message
        Assert.Equal($"{BaseUrl}/login", Driver.Url);
    }

    [Theory]
    [InlineData("", "Test123!", "John", "Doe", "email")]
    [InlineData("invalid-email", "Test123!", "John", "Doe", "email")]
    [InlineData("test@example.com", "", "John", "Doe", "password")]
    [InlineData("test@example.com", "Test123!", "", "Doe", "firstName")]
    [InlineData("test@example.com", "Test123!", "John", "", "lastName")]
    public void ShouldShowValidationErrors(string email, string password, string firstName, string lastName, string fieldWithError)
    {
        if (!string.IsNullOrEmpty(email))
            _registerPage.EnterEmail(email);
        
        if (!string.IsNullOrEmpty(password))
        {
            _registerPage.EnterPassword(password);
            _registerPage.EnterConfirmPassword(password);
        }
        
        if (!string.IsNullOrEmpty(firstName))
            _registerPage.EnterFirstName(firstName);
        
        if (!string.IsNullOrEmpty(lastName))
            _registerPage.EnterLastName(lastName);
        
        _registerPage.ClickRegisterButton();
        Assert.True(_registerPage.IsValidationErrorDisplayed(fieldWithError));
    }

    [Fact]
    public void ShouldShowErrorWhenPasswordsDoNotMatch()
    {
        _registerPage.EnterEmail("test@example.com");
        _registerPage.EnterPassword("Test123!");
        _registerPage.EnterConfirmPassword("DifferentPassword123!");
        _registerPage.EnterFirstName("John");
        _registerPage.EnterLastName("Doe");
        
        _registerPage.ClickRegisterButton();
        Assert.True(_registerPage.IsErrorMessageDisplayed());
    }

    [Fact]
    public void ShouldNavigateToLogin()
    {
        _registerPage.ClickLogin();
        Assert.Equal($"{BaseUrl}/login", Driver.Url);
    }
}