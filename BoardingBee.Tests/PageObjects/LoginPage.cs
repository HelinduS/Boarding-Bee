using OpenQA.Selenium;

namespace BoardingBee.Tests.PageObjects;

public class LoginPage
{
    private readonly IWebDriver _driver;

    // Element Locators
    private readonly By _emailInput = By.CssSelector("input[type='email']");
    private readonly By _passwordInput = By.CssSelector("input[type='password']");
    private readonly By _loginButton = By.CssSelector("button[type='submit']");
    private readonly By _forgotPasswordLink = By.LinkText("Forgot Password?");
    private readonly By _registerLink = By.LinkText("Don't have an account? Sign up");

    public LoginPage(IWebDriver driver)
    {
        _driver = driver;
    }

    public void EnterEmail(string email)
    {
        _driver.FindElement(_emailInput).SendKeys(email);
    }

    public void EnterPassword(string password)
    {
        _driver.FindElement(_passwordInput).SendKeys(password);
    }

    public void ClickLoginButton()
    {
        _driver.FindElement(_loginButton).Click();
    }

    public void Login(string email, string password)
    {
        EnterEmail(email);
        EnterPassword(password);
        ClickLoginButton();
    }

    public void ClickForgotPassword()
    {
        _driver.FindElement(_forgotPasswordLink).Click();
    }

    public void ClickRegister()
    {
        _driver.FindElement(_registerLink).Click();
    }

    public bool IsErrorMessageDisplayed()
    {
        try
        {
            return _driver.FindElement(By.CssSelector("[role='alert']")).Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
}