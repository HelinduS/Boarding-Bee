using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;

namespace BoardingBee.Tests;

public class TestBase : IDisposable
{
    protected readonly IWebDriver Driver;
    protected readonly string BaseUrl = "http://localhost:3000"; // Update this based on your frontend URL

    public TestBase()
    {
        new DriverManager().SetUpDriver(new ChromeConfig());
        Driver = new ChromeDriver();
        Driver.Manage().Window.Maximize();
        Driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(10);
    }

    public void Dispose()
    {
        Driver?.Quit();
        Driver?.Dispose();
    }

    protected void NavigateToPage(string path)
    {
        Driver.Navigate().GoToUrl($"{BaseUrl}{path}");
    }

    protected IWebElement WaitForElement(By by, int timeoutInSeconds = 10)
    {
        var wait = new OpenQA.Selenium.Support.UI.WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutInSeconds));
        return wait.Until(d => d.FindElement(by));
    }
}