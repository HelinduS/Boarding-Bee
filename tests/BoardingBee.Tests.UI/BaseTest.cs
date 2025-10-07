using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;

namespace tests.BoardingBee.Tests.UI;

public class TestBase : IDisposable
{
    protected readonly IWebDriver Driver;
    protected readonly string BaseUrl = "http://localhost:3000"; // Update this based on your frontend URL

    public TestBase()
    {
        var options = new ChromeOptions();
        options.AddArguments("--no-sandbox");
        options.AddArguments("--disable-dev-shm-usage");
        options.AddArguments("--disable-web-security");
        options.AddArguments("--window-size=1920,1080");
        options.AddArguments("--start-maximized");
        
        try
        {
            new DriverManager().SetUpDriver(new ChromeConfig());
        }
        catch
        {
            // Ignore driver manager errors and use system Chrome
        }
        
        Driver = new ChromeDriver(options);
        Driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(10);
        Driver.Manage().Timeouts().PageLoad = TimeSpan.FromSeconds(30);
    }

    public virtual void Dispose()
    {
        Thread.Sleep(3000); // Keep browser open for 3 seconds before closing
        Driver?.Quit();
        Driver?.Dispose();
    }

    protected void NavigateToPage(string path)
    {
        Driver.Navigate().GoToUrl($"{BaseUrl}{path}");
        Thread.Sleep(5000); // Wait longer for page to load and be visible
    }

    protected IWebElement WaitForElement(By by, int timeoutInSeconds = 10)
    {
        var wait = new OpenQA.Selenium.Support.UI.WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutInSeconds));
        try
        {
            return wait.Until(d => d.FindElement(by));
        }
        catch (WebDriverTimeoutException)
        {
            // Try one more time with a fresh search
            Thread.Sleep(1000);
            return Driver.FindElement(by);
        }
    }
    
    protected bool IsElementPresent(By by)
    {
        try
        {
            Driver.FindElement(by);
            return true;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
    
    protected void SlowType(IWebElement element, string text)
    {
        element.Clear();
        Thread.Sleep(500);
        foreach (char c in text)
        {
            element.SendKeys(c.ToString());
            Thread.Sleep(50); // Slow typing
        }
        Thread.Sleep(500);
    }
    
    protected void SlowClick(IWebElement element)
    {
        Thread.Sleep(1000);
        element.Click();
        Thread.Sleep(2000);
    }
    
    protected void SafeClick(By locator)
    {
        try
        {
            Thread.Sleep(1000);
            var element = WaitForElement(locator);
            ((IJavaScriptExecutor)Driver).ExecuteScript("arguments[0].click();", element);
            Thread.Sleep(2000);
        }
        catch (StaleElementReferenceException)
        {
            // Re-find and click
            var element = WaitForElement(locator);
            ((IJavaScriptExecutor)Driver).ExecuteScript("arguments[0].click();", element);
            Thread.Sleep(2000);
        }
    }
    
    protected bool WaitForUrl(string expectedUrl, int timeoutInSeconds = 10)
    {
        var wait = new OpenQA.Selenium.Support.UI.WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutInSeconds));
        try
        {
            return wait.Until(d => d.Url.Contains(expectedUrl));
        }
        catch (WebDriverTimeoutException)
        {
            return false;
        }
    }
    
    protected void WaitForPageLoad()
    {
        try
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(15));
            wait.Until(d => ((IJavaScriptExecutor)d).ExecuteScript("return document.readyState")?.Equals("complete") == true);
        }
        catch
        {
            // Ignore timeout, continue with test
        }
        Thread.Sleep(2000);
    }
    
    protected bool TryLogin(string email = "test@example.com", string password = "password123")
    {
        try
        {
            NavigateToPage("/login");
            Thread.Sleep(3000);
            
            // Try multiple possible selectors for email/username field
            var emailSelectors = new[] { By.Id("username"), By.Id("email"), By.Name("email"), By.Name("username"), By.CssSelector("input[type='email']"), By.CssSelector("input[placeholder*='email']") };
            var passwordSelectors = new[] { By.Id("password"), By.Name("password"), By.CssSelector("input[type='password']") };
            var buttonSelectors = new[] { By.CssSelector("button[type='submit']"), By.XPath("//button[contains(text(), 'Login')]"), By.XPath("//button[contains(text(), 'Sign')]"), By.TagName("button") };
            
            var emailField = FindElementWithMultipleSelectors(emailSelectors);
            var passwordField = FindElementWithMultipleSelectors(passwordSelectors);
            var loginButton = FindElementWithMultipleSelectors(buttonSelectors);
            
            SlowType(emailField, email);
            SlowType(passwordField, password);
            SlowClick(loginButton);
            
            Thread.Sleep(5000);
            return !Driver.Url.Contains("/login");
        }
        catch
        {
            return false;
        }
    }
    
    protected IWebElement FindElementWithMultipleSelectors(params By[] selectors)
    {
        foreach (var selector in selectors)
        {
            try
            {
                var element = Driver.FindElement(selector);
                if (element.Displayed)
                    return element;
            }
            catch (NoSuchElementException)
            {
                continue;
            }
        }
        throw new NoSuchElementException("None of the provided selectors found a visible element");
    }
    
    protected void LoginAsTestUser()
    {
        // Try with different test credentials
        var testCredentials = new[]
        {
            ("test@example.com", "password123"),
            ("owner@example.com", "password123"),
            ("admin@boardingbee.com", "admin123"),
            ("testuser@test.com", "testpass")
        };
        
        foreach (var (email, password) in testCredentials)
        {
            if (TryLogin(email, password))
            {
                return; // Login successful
            }
        }
        
        // Fallback: Try generic form filling
        NavigateToPage("/login");
        Thread.Sleep(3000);
        
        var inputs = Driver.FindElements(By.TagName("input"));
        if (inputs.Count >= 2)
        {
            SlowType(inputs[0], "test@example.com");
            SlowType(inputs[1], "password123");
            
            var buttons = Driver.FindElements(By.TagName("button"));
            if (buttons.Count > 0)
            {
                SlowClick(buttons[0]);
                Thread.Sleep(5000);
            }
        }
    }
}