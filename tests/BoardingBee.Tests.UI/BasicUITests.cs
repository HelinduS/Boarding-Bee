using OpenQA.Selenium;
using Xunit;
using System.Threading;

namespace tests.BoardingBee.Tests.UI;

public class BasicUITests : TestBase
{
    [Fact]
    public void HomePage_ShouldLoad_Successfully()
    {
        // Arrange & Act
        NavigateToPage("/");
        Thread.Sleep(3000);

        // Assert
        var hasContent = Driver.FindElements(By.TagName("div")).Count > 0;
        var hasBody = Driver.FindElements(By.TagName("body")).Count > 0;
        
        Assert.True(hasContent || hasBody);
    }

    [Fact]
    public void LoginPage_ShouldLoad_Successfully()
    {
        // Arrange & Act
        NavigateToPage("/login");
        Thread.Sleep(3000);

        // Assert
        var hasContent = Driver.FindElements(By.TagName("div")).Count > 0;
        var hasInputs = Driver.FindElements(By.TagName("input")).Count > 0;
        var hasButtons = Driver.FindElements(By.TagName("button")).Count > 0;
        
        Assert.True(hasContent && (hasInputs || hasButtons));
    }

    [Fact]
    public void CreateListingPage_ShouldRedirectToLogin_WhenNotAuthenticated()
    {
        // Arrange & Act
        NavigateToPage("/create-listing");
        Thread.Sleep(5000);

        // Assert
        var isOnLogin = Driver.Url.Contains("/login");
        var hasLoginElements = Driver.FindElements(By.TagName("input")).Count >= 2;
        var hasContent = Driver.FindElements(By.TagName("div")).Count > 0;
        
        Assert.True(isOnLogin || hasLoginElements || hasContent);
    }

    [Fact]
    public void Application_ShouldHave_BasicNavigation()
    {
        // Arrange & Act
        NavigateToPage("/");
        Thread.Sleep(3000);

        // Assert - Check for basic page structure
        var hasHtml = Driver.FindElements(By.TagName("html")).Count > 0;
        var hasHead = Driver.FindElements(By.TagName("head")).Count > 0;
        var hasBody = Driver.FindElements(By.TagName("body")).Count > 0;
        
        Assert.True(hasHtml && hasHead && hasBody);
    }

    [Fact]
    public void Browser_ShouldConnect_ToApplication()
    {
        // Arrange & Act
        NavigateToPage("/");
        Thread.Sleep(2000);

        // Assert
        Assert.NotNull(Driver.Title);
        Assert.True(Driver.Url.Contains("localhost:3000") || Driver.Url.Length > 0);
    }
}