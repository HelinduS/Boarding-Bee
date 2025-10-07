using OpenQA.Selenium;
using Xunit;
using OpenQA.Selenium.Support.UI;
using System;

namespace tests.BoardingBee.Tests.UI;

public class LoginTests : TestBase
{
    private const string ValidEmail = "venuja12345@gmail.com"; // Use a real, existing user
    private const string ValidPassword = "1234";

    [Fact]
    public void LoginPage_ShouldAuthenticate_ValidUser()
    {
        NavigateToPage("/login");
        var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(10));
        var emailInput = wait.Until(d => d.FindElement(By.Id("username")));
        var passwordInput = Driver.FindElement(By.Id("password"));
        var loginButton = Driver.FindElement(By.CssSelector("button[type='submit']"));

        emailInput.Clear();
        passwordInput.Clear();
        emailInput.SendKeys(ValidEmail);
        passwordInput.SendKeys(ValidPassword);
        loginButton.Click();

        // Wait for redirect to dashboard or home (role-based)
        wait.Until(d => !d.Url.Contains("/login"));
        Assert.DoesNotContain("/login", Driver.Url);
        // Optionally check for dashboard element
        Assert.True(Driver.Url.Contains("/owner-dashboard") || Driver.Url.Contains("/dashboard") || Driver.Url.Contains("/"));
    }

    [Fact]
    public void LoginPage_ShouldShowError_OnInvalidCredentials()
    {
        NavigateToPage("/login");
        var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(10));
        var emailInput = wait.Until(d => d.FindElement(By.Id("username")));
        var passwordInput = Driver.FindElement(By.Id("password"));
        var loginButton = Driver.FindElement(By.CssSelector("button[type='submit']"));

        emailInput.Clear();
        passwordInput.Clear();
        emailInput.SendKeys("invalid@example.com");
        passwordInput.SendKeys("wrongpassword");
        loginButton.Click();

        // Wait for error alert
        wait.Until(d => d.FindElements(By.CssSelector(".alert-destructive, [role='alert']")).Count > 0);
        Assert.Contains("/login", Driver.Url);
    }

    [Fact]
    public void LoginPage_ShouldRequire_FormFields()
    {
        NavigateToPage("/login");
        var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(10));
        var loginButton = wait.Until(d => d.FindElement(By.CssSelector("button[type='submit']")));
        loginButton.Click();
        // Wait for error alert
        wait.Until(d => d.FindElements(By.CssSelector(".alert-destructive, [role='alert']")).Count > 0);
        Assert.Contains("/login", Driver.Url);
    }

    [Fact]
    public void LoginPage_ShouldHave_NavigationLinks()
    {
        NavigateToPage("/login");
        var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(10));
        // Check for register and forgot password links
        var registerButton = wait.Until(d => d.FindElements(By.XPath("//button[contains(text(), 'Sign Up')]")));
        var forgotLink = Driver.FindElements(By.LinkText("Forgot Password?"));
        Assert.True(registerButton.Count > 0);
        Assert.True(forgotLink.Count > 0);
    }
}