using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace BoardingBee.Tests.PageObjects;

public class ResetPasswordPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    private readonly By _newPasswordInput = By.CssSelector("input[type='password']");
    private readonly By _confirmPasswordInput = By.XPath("(//input[@type='password'])[2]");
    private readonly By _submitButton = By.CssSelector("button[type='submit']");
    private readonly By _backButton = By.XPath("//button[contains(text(), 'Back') or contains(@class, 'back')]");

    public ResetPasswordPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TimeSpan.FromSeconds(15));
    }

    public void EnterNewPassword(string password)
    {
        var field = _wait.Until(d => d.FindElement(_newPasswordInput));
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(password);
        Thread.Sleep(500);
    }

    public void EnterConfirmPassword(string password)
    {
        var field = _driver.FindElement(_confirmPasswordInput);
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(password);
        Thread.Sleep(500);
    }

    public void ClickSubmit()
    {
        var button = _driver.FindElement(_submitButton);
        Thread.Sleep(1000);
        button.Click();
        Thread.Sleep(3000);
    }

    public void ClickBack()
    {
        try
        {
            var button = _driver.FindElement(_backButton);
            Thread.Sleep(1000);
            button.Click();
            Thread.Sleep(2000);
        }
        catch (NoSuchElementException)
        {
            // Back button might not be present
        }
    }

    public bool IsErrorMessageDisplayed()
    {
        try
        {
            Thread.Sleep(2000);
            return _driver.FindElement(By.CssSelector("[role='alert'], .text-red-500")).Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }

    public bool ArePasswordRequirementsVisible()
    {
        try
        {
            return _driver.FindElement(By.XPath("//*[contains(text(), 'Password requirements')]")).Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
}