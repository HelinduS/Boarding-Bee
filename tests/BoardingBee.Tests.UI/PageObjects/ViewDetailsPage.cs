using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace tests.BoardingBee.Tests.UI.PageObjects;

public class ViewDetailsPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    public ViewDetailsPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(10));
    }

    // Page Elements
    public IWebElement BackButton => _driver.FindElement(By.XPath("//button[contains(., 'Back')]"));
    public IWebElement ListingTitle => _driver.FindElement(By.XPath("//h1[contains(@class, 'text-2xl')]"));
    public IWebElement LocationText => _driver.FindElement(By.XPath("//p[contains(@class, 'text-muted-foreground')]"));
    public IWebElement MainImage => _driver.FindElement(By.XPath("//img[contains(@alt, 'Cozy Room')]"));
    public IWebElement DescriptionCard => _driver.FindElement(By.XPath("//div[contains(., 'About this place')]"));
    public IWebElement AmenitiesCard => _driver.FindElement(By.XPath("//div[contains(., 'Amenities')]"));
    public IWebElement PriceText => _driver.FindElement(By.XPath("//div[contains(@class, 'text-2xl font-bold')]"));
    public IWebElement AvailabilityBadge => _driver.FindElement(By.XPath("//span[contains(@class, 'bg-green-100') or contains(text(), 'Available')]"));
    public IWebElement ContactOwnerButton => _driver.FindElement(By.XPath("//button[contains(., 'Contact Owner')]"));
    public IWebElement OwnerName => _driver.FindElement(By.XPath("//div[contains(@class, 'font-medium')]"));
    public IWebElement OwnerRating => _driver.FindElement(By.XPath("//div[contains(., 'reviews')]"));
    public IWebElement ContactPhone => _driver.FindElement(By.XPath("//span[contains(text(), '+94')]"));
    public IWebElement ContactEmail => _driver.FindElement(By.XPath("//span[contains(text(), '@')]"));

    // Actions
    public void ClickBackButton()
    {
        BackButton.Click();
        Thread.Sleep(2000);
    }

    public void ClickContactOwnerButton()
    {
        ContactOwnerButton.Click();
        Thread.Sleep(2000);
    }

    public string GetListingTitle()
    {
        return ListingTitle.Text;
    }

    public string GetLocationText()
    {
        return LocationText.Text;
    }

    public string GetPriceText()
    {
        return PriceText.Text;
    }

    public string GetAvailabilityStatus()
    {
        return AvailabilityBadge.Text;
    }

    public string GetOwnerName()
    {
        return OwnerName.Text;
    }

    public string GetContactPhone()
    {
        return ContactPhone.Text;
    }

    public string GetContactEmail()
    {
        return ContactEmail.Text;
    }

    public bool IsDescriptionVisible()
    {
        try
        {
            return DescriptionCard.Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }

    public bool IsAmenitiesVisible()
    {
        try
        {
            return AmenitiesCard.Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }

    public bool IsMainImageVisible()
    {
        try
        {
            return MainImage.Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }

    public List<string> GetAmenities()
    {
        var amenityElements = _driver.FindElements(By.XPath("//div[contains(., 'Amenities')]//span[contains(@class, 'text-sm')]"));
        return amenityElements.Select(e => e.Text).ToList();
    }

    public bool WaitForPageLoad()
    {
        try
        {
            _wait.Until(d => d.FindElement(By.XPath("//h1[contains(@class, 'text-2xl')]")));
            return true;
        }
        catch (WebDriverTimeoutException)
        {
            return false;
        }
    }

    // Additional helper methods for robust testing
    public bool IsPageLoaded()
    {
        try
        {
            return _driver.FindElements(By.TagName("h1")).Count > 0 &&
                   _driver.FindElements(By.TagName("img")).Count > 0;
        }
        catch
        {
            return false;
        }
    }

    public bool HasPriceInformation()
    {
        try
        {
            var priceElements = _driver.FindElements(By.XPath("//div[contains(@class, 'text-2xl font-bold')]"));
            return priceElements.Count > 0 || _driver.PageSource.Contains("LKR") || _driver.PageSource.Contains("25000");
        }
        catch
        {
            return false;
        }
    }

    public bool HasContactInformation()
    {
        try
        {
            return _driver.PageSource.Contains("+94") || _driver.PageSource.Contains("@gmail.com") ||
                   _driver.FindElements(By.XPath("//div[contains(., 'Contact Information')]")).Count > 0;
        }
        catch
        {
            return false;
        }
    }

    public bool HasOwnerInformation()
    {
        try
        {
            return _driver.FindElements(By.XPath("//div[contains(., 'Owner')]")).Count > 0 ||
                   _driver.PageSource.Contains("Priya") ||
                   _driver.FindElements(By.XPath("//div[contains(@class, 'font-medium')]")).Count > 0;
        }
        catch
        {
            return false;
        }
    }

    public bool HasAmenities()
    {
        try
        {
            return _driver.FindElements(By.XPath("//div[contains(., 'Amenities')]")).Count > 0 ||
                   _driver.PageSource.Contains("WiFi") || _driver.PageSource.Contains("AC");
        }
        catch
        {
            return false;
        }
    }

    public bool HasDescription()
    {
        try
        {
            return _driver.FindElements(By.XPath("//div[contains(., 'About this place')]")).Count > 0 ||
                   _driver.PageSource.Contains("comfortable") || _driver.PageSource.Contains("furnished");
        }
        catch
        {
            return false;
        }
    }

    public int GetImageCount()
    {
        try
        {
            return _driver.FindElements(By.TagName("img")).Count;
        }
        catch
        {
            return 0;
        }
    }

    public bool IsResponsiveLayout()
    {
        try
        {
            var gridElements = _driver.FindElements(By.XPath("//div[contains(@class, 'grid')]"));
            var responsiveElements = _driver.FindElements(By.XPath("//div[contains(@class, 'lg:col-span') or contains(@class, 'md:col-span')]"));
            return gridElements.Count > 0 && responsiveElements.Count > 0;
        }
        catch
        {
            return false;
        }
    }
}