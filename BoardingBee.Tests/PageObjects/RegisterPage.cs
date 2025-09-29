using OpenQA.Selenium;

namespace BoardingBee.Tests.PageObjects;

public class RegisterPage
{
    private readonly IWebDriver _driver;

    // Element Locators
    private readonly By _emailInput = By.CssSelector("input[type='email']");
    private readonly By _passwordInput = By.CssSelector("input[type='password']");
    private readonly By _confirmPasswordInput = By.CssSelector("input[name='confirmPassword']");
    private readonly By _firstNameInput = By.CssSelector("input[name='firstName']");
    private readonly By _lastNameInput = By.CssSelector("input[name='lastName']");
    private readonly By _registerButton = By.CssSelector("button[type='submit']");
    private readonly By _loginLink = By.LinkText("Already have an account? Sign in");

    public RegisterPage(IWebDriver driver)
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

    public void EnterConfirmPassword(string confirmPassword)
    {
        _driver.FindElement(_confirmPasswordInput).SendKeys(confirmPassword);
    }

    public void EnterFirstName(string firstName)
    {
        _driver.FindElement(_firstNameInput).SendKeys(firstName);
    }

    public void EnterLastName(string lastName)
    {
        _driver.FindElement(_lastNameInput).SendKeys(lastName);
    }

    public void ClickRegisterButton()
    {
        _driver.FindElement(_registerButton).Click();
    }

    public void Register(string email, string password, string firstName, string lastName)
    {
        EnterEmail(email);
        EnterPassword(password);
        EnterConfirmPassword(password);
        EnterFirstName(firstName);
        EnterLastName(lastName);
        ClickRegisterButton();
    }

    public void ClickLogin()
    {
        _driver.FindElement(_loginLink).Click();
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

    public bool IsValidationErrorDisplayed(string fieldName)
    {
        try
        {
            return _driver.FindElement(By.CssSelector($"[aria-describedby='{fieldName}-error']")).Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
}