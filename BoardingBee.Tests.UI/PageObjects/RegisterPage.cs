using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace BoardingBee.Tests.PageObjects;

public class RegisterPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    // Element Locators
    private readonly By _usernameInput = By.Id("username");
    private readonly By _emailInput = By.Id("email");
    private readonly By _passwordInput = By.Id("password");
    private readonly By _confirmPasswordInput = By.Id("confirmPassword");
    private readonly By _firstNameInput = By.Id("firstName");
    private readonly By _lastNameInput = By.Id("lastName");
    private readonly By _nextButton = By.XPath("//button[contains(text(), 'Next')]");
    private readonly By _registerButton = By.CssSelector("button[type='submit']");
    private readonly By _loginLink = By.LinkText("Login");
    private readonly By _userTypeSelect = By.CssSelector("[role='combobox']");

    public RegisterPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
    }

    public void EnterUsername(string username)
    {
        var field = _wait.Until(d => d.FindElement(_usernameInput));
        field.Clear();
        Thread.Sleep(500);
        foreach (char c in username)
        {
            field.SendKeys(c.ToString());
            Thread.Sleep(50);
        }
        Thread.Sleep(500);
    }

    public void EnterEmail(string email)
    {
        var field = _wait.Until(d => d.FindElement(_emailInput));
        field.Clear();
        Thread.Sleep(500);
        foreach (char c in email)
        {
            field.SendKeys(c.ToString());
            Thread.Sleep(50);
        }
        Thread.Sleep(500);
    }

    public void EnterPassword(string password)
    {
        var field = _wait.Until(d => d.FindElement(_passwordInput));
        field.Clear();
        Thread.Sleep(500);
        foreach (char c in password)
        {
            field.SendKeys(c.ToString());
            Thread.Sleep(50);
        }
        Thread.Sleep(500);
    }

    public void EnterConfirmPassword(string confirmPassword)
    {
        var field = _wait.Until(d => d.FindElement(_confirmPasswordInput));
        field.Clear();
        Thread.Sleep(500);
        foreach (char c in confirmPassword)
        {
            field.SendKeys(c.ToString());
            Thread.Sleep(50);
        }
        Thread.Sleep(500);
    }

    public void SelectUserType(string userType = "student")
    {
        try
        {
            _driver.FindElement(_userTypeSelect).Click();
            Thread.Sleep(500);
            var option = _driver.FindElement(By.XPath($"//div[contains(@class, 'select-item') or @role='option'][contains(text(), 'Student')]"));
            option.Click();
        }
        catch
        {
            // If dropdown doesn't work, try alternative approach
            var selectElement = _driver.FindElement(By.CssSelector("select, [role='combobox']"));
            selectElement.Click();
            Thread.Sleep(500);
            var studentOption = _driver.FindElement(By.XPath("//option[contains(text(), 'Student')] | //*[contains(text(), 'Student')]"));
            studentOption.Click();
        }
    }

    public void ClickNext()
    {
        var nextBtn = _wait.Until(d => d.FindElement(_nextButton));
        Thread.Sleep(1000);
        nextBtn.Click();
        Thread.Sleep(2000);
    }

    public void EnterFirstName(string firstName)
    {
        var field = _wait.Until(d => d.FindElement(_firstNameInput));
        field.Clear();
        field.SendKeys(firstName);
    }

    public void EnterLastName(string lastName)
    {
        var field = _driver.FindElement(_lastNameInput);
        field.Clear();
        field.SendKeys(lastName);
    }

    public void SelectGender(string gender = "male")
    {
        _driver.FindElement(By.XPath($"//input[@value='{gender}' and @name='gender']")).Click();
    }

    public void EnterInstitution(string institution)
    {
        var field = _driver.FindElement(By.Id("institutionCompany"));
        field.Clear();
        field.SendKeys(institution);
    }

    public void EnterLocation(string location)
    {
        var field = _driver.FindElement(By.Id("location"));
        field.Clear();
        field.SendKeys(location);
    }

    public void CompleteStep2()
    {
        ClickNext();
    }

    public void EnterPhoneNumber(string phone)
    {
        var field = _wait.Until(d => d.FindElement(By.Id("phoneNumber")));
        field.Clear();
        field.SendKeys(phone);
    }

    public void EnterEmergencyContact(string contact)
    {
        var field = _driver.FindElement(By.Id("emergencyContact"));
        field.Clear();
        field.SendKeys(contact);
    }

    public void EnterPermanentAddress(string address)
    {
        var field = _driver.FindElement(By.Id("permanentAddress"));
        field.Clear();
        field.SendKeys(address);
    }

    public void ClickRegisterButton()
    {
        var registerBtn = _wait.Until(d => d.FindElement(_registerButton));
        Thread.Sleep(1000);
        registerBtn.Click();
        Thread.Sleep(3000);
    }

    public void Register(string email, string password, string firstName, string lastName)
    {
        // Step 1: Account info
        EnterUsername($"user_{DateTime.Now.Ticks}");
        EnterEmail(email);
        EnterPassword(password);
        EnterConfirmPassword(password);
        SelectUserType();
        ClickNext();

        // Step 2: Personal info
        EnterFirstName(firstName);
        EnterLastName(lastName);
        SelectGender();
        EnterInstitution("Test Institution");
        EnterLocation("Test Location");
        CompleteStep2();

        // Step 3: Contact info
        EnterPhoneNumber("1234567890");
        EnterEmergencyContact("0987654321");
        EnterPermanentAddress("123 Test Street");
        ClickRegisterButton();
    }

    public void ClickLogin()
    {
        var loginLink = _wait.Until(d => d.FindElement(_loginLink));
        Thread.Sleep(1000);
        loginLink.Click();
        Thread.Sleep(2000);
    }

    public bool IsErrorMessageDisplayed()
    {
        try
        {
            Thread.Sleep(2000); // Wait for error to appear
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
            return _driver.FindElement(By.CssSelector("[role='alert']")).Displayed;
        }
        catch (NoSuchElementException)
        {
            return false;
        }
    }
}