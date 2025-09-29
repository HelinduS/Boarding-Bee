using OpenQA.Selenium;

namespace BoardingBee.Tests.PageObjects;

public class OwnerDashboardPage
{
    private readonly IWebDriver _driver;

    public OwnerDashboardPage(IWebDriver driver)
    {
        _driver = driver;
    }

    public bool IsPageLoaded()
    {
        return _driver.FindElements(By.TagName("div")).Count > 0;
    }

    public bool HasDashboardContent()
    {
        return _driver.FindElements(By.CssSelector("div, section, main")).Count > 0;
    }

    public bool HasNavigationElements()
    {
        return _driver.FindElements(By.CssSelector("nav, a, button")).Count > 0;
    }

    public bool HasListings()
    {
        return _driver.FindElements(By.CssSelector("div, card, section")).Count > 0;
    }
}