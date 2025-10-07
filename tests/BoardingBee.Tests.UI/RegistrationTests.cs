using OpenQA.Selenium;
using Xunit;
using OpenQA.Selenium.Support.UI;
using System;

namespace tests.BoardingBee.Tests.UI;

public class RegistrationTests : TestBase
{
    private string UniqueUser() => $"testuser_{Guid.NewGuid().ToString("N").Substring(0, 8)}";

    [Fact]
    public void Registration_ShouldComplete_MultiStepFlow()
    {
        NavigateToPage("/register");
        var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(10));

        // Step 1: Account
        var username = UniqueUser();
        wait.Until(d => d.FindElement(By.Id("username"))).SendKeys(username);
        Driver.FindElement(By.Id("email")).SendKeys($"{username}@example.com");
        Driver.FindElement(By.Id("password")).SendKeys("TestPassword123!");
        Driver.FindElement(By.Id("confirmPassword")).SendKeys("TestPassword123!");
        // Select user type (open dropdown, select Student)
        Driver.FindElement(By.CssSelector("button[role='combobox']")).Click();
        wait.Until(d => d.FindElement(By.XPath("//*[contains(@role,'option') or contains(@role,'menuitem') or contains(@role,'listitem')][text()='Student']"))).Click();
        Driver.FindElement(By.XPath("//button[contains(text(), 'Next')]")).Click();

        // Step 2: Personal
        wait.Until(d => d.FindElement(By.Id("firstName"))).SendKeys("Test");
        Driver.FindElement(By.Id("lastName")).SendKeys("User");
        // Select gender radio
        Driver.FindElement(By.CssSelector("input[type='radio'][name='gender'][value='male']")).Click();
        Driver.FindElement(By.Id("institutionCompany")).SendKeys("Test Institution");
        Driver.FindElement(By.Id("location")).SendKeys("Test City");
        Driver.FindElement(By.XPath("//button[contains(text(), 'Next')]")).Click();

        // Step 3: Contact
        wait.Until(d => d.FindElement(By.Id("phoneNumber"))).SendKeys("1234567890");
        Driver.FindElement(By.Id("emergencyContact")).SendKeys("0987654321");
        Driver.FindElement(By.Id("permanentAddress")).SendKeys("123 Test Street");

        // Submit registration
        var registerButton = Driver.FindElement(By.CssSelector("button[type='submit']"));
        registerButton.Click();

        // Wait for redirect or success (could be /login or dashboard, depending on backend)
        wait.Until(d => !d.Url.Contains("/register"));
        Assert.DoesNotContain("/register", Driver.Url);
    }
}