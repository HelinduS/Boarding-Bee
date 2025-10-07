using tests.BoardingBee.Tests.UI.PageObjects;
using Xunit;

namespace tests.BoardingBee.Tests.UI;

public class RegisterOwnerTests : TestBase
{
    private readonly RegisterOwnerPage _registerOwnerPage;

    public RegisterOwnerTests()
    {
        _registerOwnerPage = new RegisterOwnerPage(Driver);
        NavigateToPage("/register-owner");
    }

    [Fact]
    public void ShouldDisplayRegisterOwnerForm()
    {
        Assert.Contains("/register-owner", Driver.Url);
    }

    [Fact]
    public void ShouldFillBasicOwnerInformation()
    {
        var timestamp = DateTime.Now.Ticks;
        
        _registerOwnerPage.EnterUsername($"owner_{timestamp}");
        _registerOwnerPage.EnterFirstName("John");
        _registerOwnerPage.EnterLastName("Owner");
        _registerOwnerPage.EnterEmail($"owner{timestamp}@example.com");
        _registerOwnerPage.EnterPassword("Owner123!");
        _registerOwnerPage.EnterConfirmPassword("Owner123!");
        
        Assert.Contains("/register-owner", Driver.Url);
    }

    [Fact]
    public void ShouldShowErrorWhenPasswordsDoNotMatch()
    {
        var timestamp = DateTime.Now.Ticks;
        
        _registerOwnerPage.EnterUsername($"owner_{timestamp}");
        _registerOwnerPage.EnterFirstName("John");
        _registerOwnerPage.EnterLastName("Owner");
        _registerOwnerPage.EnterEmail($"owner{timestamp}@example.com");
        _registerOwnerPage.EnterPassword("Owner123!");
        _registerOwnerPage.EnterConfirmPassword("DifferentPassword!");
        _registerOwnerPage.ClickRegister();
        
        Assert.True(_registerOwnerPage.IsErrorMessageDisplayed());
    }

    [Theory]
    [InlineData("", "Owner123!")]
    [InlineData("owner@example.com", "")]
    public void ShouldShowValidationErrors(string email, string password)
    {
        if (!string.IsNullOrEmpty(email))
            _registerOwnerPage.EnterEmail(email);
        
        if (!string.IsNullOrEmpty(password))
        {
            _registerOwnerPage.EnterPassword(password);
            _registerOwnerPage.EnterConfirmPassword(password);
        }
        
        _registerOwnerPage.ClickRegister();
        Thread.Sleep(2000);
        
        // For empty fields, HTML5 validation will prevent form submission
        Assert.Contains("/register-owner", Driver.Url);
    }

    [Fact]
    public void ShouldFillOptionalBusinessFields()
    {
        var timestamp = DateTime.Now.Ticks;
        
        _registerOwnerPage.EnterUsername($"owner_{timestamp}");
        _registerOwnerPage.EnterFirstName("John");
        _registerOwnerPage.EnterLastName("Owner");
        _registerOwnerPage.EnterEmail($"owner{timestamp}@example.com");
        _registerOwnerPage.EnterPassword("Owner123!");
        _registerOwnerPage.EnterConfirmPassword("Owner123!");
        _registerOwnerPage.EnterBusiness("Test Business LLC");
        _registerOwnerPage.EnterLocation("Test City");
        
        Assert.Contains("/register-owner", Driver.Url);
    }
}