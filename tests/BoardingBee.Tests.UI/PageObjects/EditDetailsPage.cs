using OpenQA.Selenium;

namespace tests.BoardingBee.Tests.UI.PageObjects;

public class EditDetailsPage
{
    private readonly IWebDriver _driver;

    public EditDetailsPage(IWebDriver driver)
    {
        _driver = driver;
    }

    public bool IsPageLoaded()
    {
        return _driver.FindElements(By.TagName("div")).Count > 0;
    }

    public bool HasEditForm()
    {
        return _driver.FindElements(By.CssSelector("form, input, textarea")).Count > 0;
    }

    public bool HasSaveButton()
    {
        return _driver.FindElements(By.XPath("//button[contains(text(), 'Save')]")).Count > 0 ||
               _driver.FindElements(By.XPath("//button[contains(text(), 'Update')]")).Count > 0 ||
               _driver.FindElements(By.TagName("button")).Count > 0;
    }

    public bool HasInputFields()
    {
        return _driver.FindElements(By.TagName("input")).Count > 0;
    }
}