using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace tests.BoardingBee.Tests.UI.PageObjects;

public class LoginPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    // Element Locators
    private readonly By _emailInput = By.Id("username");
    private readonly By _passwordInput = By.Id("password");
    private readonly By _loginButton = By.CssSelector("button[type='submit']");
    private readonly By _forgotPasswordLink = By.LinkText("Forgot Password?");
    private readonly By _signUpButton = By.XPath("//button[contains(text(), 'Sign Up')]");

    public LoginPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TimeSpan.FromSeconds(15));
    }

    public void EnterEmail(string email)
    {
        var emailField = _wait.Until(d => d.FindElement(_emailInput));
        emailField.Clear();
        Thread.Sleep(200);
        emailField.SendKeys(email);
        Thread.Sleep(300);
    }

    public void EnterPassword(string password)
    {
        var passwordField = _wait.Until(d => d.FindElement(_passwordInput));
        passwordField.Clear();
        Thread.Sleep(200);
        passwordField.SendKeys(password);
        Thread.Sleep(300);
    }

    public void ClickLoginButton()
    {
        var button = _wait.Until(d => d.FindElement(_loginButton));
        Thread.Sleep(500);
        ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", button);
        Thread.Sleep(2000);
    }

    public void Login(string email, string password)
    {
        EnterEmail(email);
        EnterPassword(password);
        ClickLoginButton();
    }

    public void ClickForgotPassword()
    {
        try
        {
            var link = _wait.Until(d => d.FindElement(_forgotPasswordLink));
            Thread.Sleep(500);
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", link);
            Thread.Sleep(2000);
        }
        catch (WebDriverTimeoutException)
        {
            // Link might not be present
        }
    }

    public void ClickRegister()
    {
        try
        {
            var button = _wait.Until(d => d.FindElement(_signUpButton));
            Thread.Sleep(500);
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", button);
            Thread.Sleep(2000);
        }
        catch (WebDriverTimeoutException)
        {
            // Button might not be present
        }
    }

    public bool IsErrorMessageDisplayed()
    {
        try
        {
            Thread.Sleep(1000);
            var errorElement = _driver.FindElement(By.CssSelector("[role='alert'], .text-red-500, .error"));
            return errorElement.Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
}