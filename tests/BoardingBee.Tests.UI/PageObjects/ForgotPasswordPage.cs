using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace tests.BoardingBee.Tests.UI.PageObjects;

public class ForgotPasswordPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    private readonly By _emailInput = By.CssSelector("input[placeholder*='email']");
    private readonly By _sendButton = By.CssSelector("button[type='submit']");
    private readonly By _backButton = By.XPath("//button[contains(text(), 'Back') or contains(@class, 'back')]");

    public ForgotPasswordPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TimeSpan.FromSeconds(15));
    }

    public void EnterEmail(string email)
    {
        var field = _wait.Until(d => d.FindElement(_emailInput));
        field.Clear();
        Thread.Sleep(500);
        field.SendKeys(email);
        Thread.Sleep(500);
    }

    public void ClickSendResetCode()
    {
        var button = _driver.FindElement(_sendButton);
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
}