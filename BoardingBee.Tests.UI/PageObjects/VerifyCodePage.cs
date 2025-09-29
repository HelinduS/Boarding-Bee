using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace BoardingBee.Tests.PageObjects;

public class VerifyCodePage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    private readonly By _otpInputs = By.CssSelector("input[type='text']");
    private readonly By _verifyButton = By.XPath("//button[contains(text(), 'Verify')]");
    private readonly By _resendButton = By.XPath("//button[contains(text(), 'Resend')]");
    private readonly By _backButton = By.XPath("//button[contains(text(), 'Back') or contains(@class, 'back')]");

    public VerifyCodePage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TimeSpan.FromSeconds(15));
    }

    public void EnterCode(string code)
    {
        Thread.Sleep(1000);
        
        for (int i = 0; i < code.Length && i < 6; i++) // Limit to 6 digits max
        {
            try
            {
                var inputs = _wait.Until(d => d.FindElements(_otpInputs));
                if (i < inputs.Count)
                {
                    inputs[i].Clear();
                    Thread.Sleep(100);
                    inputs[i].SendKeys(code[i].ToString());
                    Thread.Sleep(200);
                }
            }
            catch (StaleElementReferenceException)
            {
                // Re-find elements and try again
                var inputs = _wait.Until(d => d.FindElements(_otpInputs));
                if (i < inputs.Count)
                {
                    inputs[i].Clear();
                    Thread.Sleep(100);
                    inputs[i].SendKeys(code[i].ToString());
                    Thread.Sleep(200);
                }
            }
        }
        Thread.Sleep(500);
    }

    public void ClickVerify()
    {
        try
        {
            Thread.Sleep(1000);
            var button = _wait.Until(d => d.FindElement(_verifyButton));
            
            // Use JavaScript click to avoid stale element issues
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", button);
            Thread.Sleep(3000);
        }
        catch (NoSuchElementException)
        {
            // Auto-verify might be enabled
        }
        catch (WebDriverTimeoutException)
        {
            // Button might not be present
        }
        catch (StaleElementReferenceException)
        {
            // Re-find and click the element
            try
            {
                var button = _wait.Until(d => d.FindElement(_verifyButton));
                ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", button);
                Thread.Sleep(3000);
            }
            catch
            {
                // If still fails, continue without clicking
            }
        }
    }

    public void ClickResend()
    {
        try
        {
            var button = _wait.Until(d => d.FindElement(_resendButton));
            Thread.Sleep(1000);
            
            // Check if button is enabled before clicking
            if (button.Enabled)
            {
                // Try JavaScript click if regular click fails
                try
                {
                    button.Click();
                }
                catch (ElementClickInterceptedException)
                {
                    ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", button);
                }
            }
            Thread.Sleep(2000);
        }
        catch (NoSuchElementException)
        {
            // Resend might not be available
        }
        catch (WebDriverTimeoutException)
        {
            // Button might not be present
        }
    }

    public void ClickBack()
    {
        try
        {
            Thread.Sleep(1000);
            var button = _wait.Until(d => d.FindElement(_backButton));
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", button);
            Thread.Sleep(2000);
        }
        catch (NoSuchElementException)
        {
            // Back button might not be present
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
            Thread.Sleep(2000);
            return _driver.FindElement(By.CssSelector("[role='alert'], .text-red-500")).Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
}