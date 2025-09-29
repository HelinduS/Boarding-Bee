using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace BoardingBee.Tests.PageObjects;

public class CreateListingPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    // Element Locators
    private readonly By _titleInput = By.Id("title");
    private readonly By _locationInput = By.Id("location");
    private readonly By _priceInput = By.Id("price");
    private readonly By _descriptionInput = By.Id("description");
    private readonly By _facilitiesInput = By.Id("facilities");
    private readonly By _isAvailableCheckbox = By.XPath("//button[@role='checkbox']");
    private readonly By _imagesInput = By.Id("images");
    private readonly By _createButton = By.CssSelector("button[type='submit']");
    private readonly By _successAlert = By.CssSelector("[role='alert']:not([data-variant='destructive'])");
    private readonly By _errorAlert = By.CssSelector("[role='alert'][data-variant='destructive']");

    public CreateListingPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TimeSpan.FromSeconds(15));
    }

    public bool IsOnCreateListingPage()
    {
        try
        {
            return _driver.Url.Contains("/create-listing") && 
                   (_driver.FindElements(_titleInput).Count > 0 ||
                    _driver.PageSource.Contains("create") ||
                    _driver.PageSource.Contains("listing"));
        }
        catch
        {
            return false;
        }
    }

    public bool IsRedirectedToLogin()
    {
        return _driver.Url.Contains("/login");
    }

    public void EnterTitle(string title)
    {
        try
        {
            var titleField = _wait.Until(d => d.FindElement(_titleInput));
            titleField.Clear();
            Thread.Sleep(200);
            titleField.SendKeys(title);
            Thread.Sleep(300);
        }
        catch (WebDriverTimeoutException)
        {
            // Field might not be present
        }
    }

    public void EnterLocation(string location)
    {
        try
        {
            var locationField = _wait.Until(d => d.FindElement(_locationInput));
            locationField.Clear();
            Thread.Sleep(200);
            locationField.SendKeys(location);
            Thread.Sleep(300);
        }
        catch (WebDriverTimeoutException)
        {
            // Field might not be present
        }
    }

    public void EnterPrice(string price)
    {
        try
        {
            var priceField = _wait.Until(d => d.FindElement(_priceInput));
            priceField.Clear();
            Thread.Sleep(200);
            priceField.SendKeys(price);
            Thread.Sleep(300);
        }
        catch (WebDriverTimeoutException)
        {
            // Field might not be present
        }
    }

    public void EnterDescription(string description)
    {
        try
        {
            var descriptionField = _wait.Until(d => d.FindElement(_descriptionInput));
            descriptionField.Clear();
            Thread.Sleep(200);
            descriptionField.SendKeys(description);
            Thread.Sleep(300);
        }
        catch (WebDriverTimeoutException)
        {
            // Field might not be present
        }
    }

    public void EnterFacilities(string facilities)
    {
        try
        {
            var facilitiesField = _wait.Until(d => d.FindElement(_facilitiesInput));
            facilitiesField.Clear();
            Thread.Sleep(200);
            facilitiesField.SendKeys(facilities);
            Thread.Sleep(300);
        }
        catch (WebDriverTimeoutException)
        {
            // Field might not be present
        }
    }

    public void SetAvailability(bool isAvailable)
    {
        try
        {
            var checkbox = _wait.Until(d => d.FindElement(_isAvailableCheckbox));
            var isChecked = checkbox.GetAttribute("data-state") == "checked";
            
            if (isAvailable != isChecked)
            {
                Thread.Sleep(500);
                ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", checkbox);
                Thread.Sleep(500);
            }
        }
        catch (WebDriverTimeoutException)
        {
            // Checkbox might not be present or already in desired state
        }
    }

    public void UploadImages(string imagePath)
    {
        try
        {
            var imageField = _wait.Until(d => d.FindElement(_imagesInput));
            Thread.Sleep(500);
            imageField.SendKeys(imagePath);
            Thread.Sleep(1000);
        }
        catch (WebDriverTimeoutException)
        {
            // Field might not be present
        }
    }

    public void ClickCreateButton()
    {
        try
        {
            var button = _wait.Until(d => d.FindElement(_createButton));
            Thread.Sleep(500);
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", button);
            Thread.Sleep(3000); // Wait for form submission
        }
        catch (WebDriverTimeoutException)
        {
            // Button might not be present or clickable
        }
    }

    public void CreateListing(string title, string location, string price, string description, string facilities, string imagePath, bool isAvailable = true)
    {
        EnterTitle(title);
        EnterLocation(location);
        EnterPrice(price);
        EnterDescription(description);
        EnterFacilities(facilities);
        SetAvailability(isAvailable);
        UploadImages(imagePath);
        ClickCreateButton();
    }

    public bool IsSuccessMessageDisplayed()
    {
        try
        {
            Thread.Sleep(2000);
            var successElement = _driver.FindElement(_successAlert);
            return successElement.Displayed && successElement.Text.Contains("successfully");
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }

    public bool IsErrorMessageDisplayed()
    {
        try
        {
            Thread.Sleep(1000);
            var errorElement = _driver.FindElement(_errorAlert);
            return errorElement.Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }

    public string GetSuccessMessage()
    {
        try
        {
            var successElement = _wait.Until(d => d.FindElement(_successAlert));
            return successElement.Text;
        }
        catch (WebDriverTimeoutException)
        {
            return "";
        }
    }

    public bool IsFormCleared()
    {
        try
        {
            Thread.Sleep(1000);
            var titleField = _driver.FindElement(_titleInput);
            var locationField = _driver.FindElement(_locationInput);
            var priceField = _driver.FindElement(_priceInput);
            
            return string.IsNullOrEmpty(titleField.GetAttribute("value")) &&
                   string.IsNullOrEmpty(locationField.GetAttribute("value")) &&
                   string.IsNullOrEmpty(priceField.GetAttribute("value"));
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
}