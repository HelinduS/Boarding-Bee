using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace tests.BoardingBee.Tests.UI.PageObjects;

public class RegisterOwnerPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    private readonly By _usernameInput = By.CssSelector("input[name='username']");
    private readonly By _firstNameInput = By.CssSelector("input[name='firstName']");
    private readonly By _lastNameInput = By.CssSelector("input[name='lastName']");
    private readonly By _emailInput = By.CssSelector("input[name='email']");
    private readonly By _passwordInput = By.CssSelector("input[name='password']");
    private readonly By _confirmPasswordInput = By.CssSelector("input[name='confirmPassword']");
    private readonly By _businessInput = By.CssSelector("input[name='business']");
    private readonly By _locationInput = By.CssSelector("input[name='location']");
    private readonly By _registerButton = By.CssSelector("button[type='submit']");

    public RegisterOwnerPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TimeSpan.FromSeconds(15));
    }

    public void EnterUsername(string username)
    {
        var field = _wait.Until(d => d.FindElement(_usernameInput));
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(username);
        Thread.Sleep(500);
    }

    public void EnterFirstName(string firstName)
    {
        var field = _driver.FindElement(_firstNameInput);
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(firstName);
        Thread.Sleep(500);
    }

    public void EnterLastName(string lastName)
    {
        var field = _driver.FindElement(_lastNameInput);
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(lastName);
        Thread.Sleep(500);
    }

    public void EnterEmail(string email)
    {
        var field = _driver.FindElement(_emailInput);
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(email);
        Thread.Sleep(500);
    }

    public void EnterPassword(string password)
    {
        var field = _driver.FindElement(_passwordInput);
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(password);
        Thread.Sleep(500);
    }

    public void EnterConfirmPassword(string confirmPassword)
    {
        var field = _driver.FindElement(_confirmPasswordInput);
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(confirmPassword);
        Thread.Sleep(500);
    }

    public void EnterBusiness(string business)
    {
        var field = _driver.FindElement(_businessInput);
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(business);
        Thread.Sleep(500);
    }

    public void EnterLocation(string location)
    {
        var field = _driver.FindElement(_locationInput);
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(location);
        Thread.Sleep(500);
    }

    public void ClickRegister()
    {
        var button = _driver.FindElement(_registerButton);
        Thread.Sleep(1000);
        button.Click();
        Thread.Sleep(3000);
    }

    public bool IsErrorMessageDisplayed()
    {
        try
        {
            Thread.Sleep(2000);
            return _driver.FindElement(By.CssSelector("[role='alert']")).Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }

    public bool IsSuccessMessageDisplayed()
    {
        try
        {
            Thread.Sleep(2000);
            return _driver.FindElement(By.XPath("//*[contains(text(), 'Registration successful')]")).Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
}