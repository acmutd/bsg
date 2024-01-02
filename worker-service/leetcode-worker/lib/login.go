package lib

import (
	"log"
	"time"

	"github.com/acmutd/bsg/worker-service/leetcode-worker/utils"
	"github.com/tebeka/selenium"
	"github.com/tebeka/selenium/chrome"
)

func Login(username string, password string, chromedriverPath string) (string, string) {
	// initialize a Chrome browser instance on port 4444
	service, err := selenium.NewChromeDriverService(chromedriverPath, 4444)

	if err != nil {
		log.Fatal("Error:", err)
	}

	defer service.Stop()

	// configure the browser options

	caps := selenium.Capabilities{}
	caps.AddChrome(chrome.Capabilities{Args: []string{
		// "--headless", // comment out this line for testing
	}})

	// create a new remote client with the specified options
	driver, err := selenium.NewRemote(caps, "")
	if err != nil {
		log.Fatal("Error:", err)
	}

	// Navigate to the LeetCode login page
	err = driver.Get(Uris_US.Login)
	if err != nil {
		log.Fatalf("Failed to navigate to the login page: %v", err)
	}

	driver.Wait(func(wd selenium.WebDriver) (bool, error) {
		elem, err := wd.FindElement(selenium.ByID, "id_login")
		if err != nil {
			return false, nil
		}
		return elem != nil, nil
	})

	// Locate the email and password input fields and login button
	emailField, err := driver.FindElement(selenium.ByID, "id_login")
	if err != nil {
		log.Fatalf("Failed to find the email field: %v", err)
	}
	passwordField, err := driver.FindElement(selenium.ByID, "id_password")
	if err != nil {
		log.Fatalf("Failed to find the password field: %v", err)
	}
	loginButton, err := driver.FindElement(selenium.ByID, "signin_btn")
	if err != nil {
		log.Fatalf("Failed to find the login button: %v", err)
	}

	// Enter your LeetCode username and password
	emailField.SendKeys(username)
	passwordField.SendKeys(password)
	passwordField.Click()

	// Click the login button
	time.Sleep(1 * time.Second)
	loginButton.Click()

	// Load leetcode homepage to get cookies
	time.Sleep(1 * time.Second)
	err = driver.Get(Uris_US.Base)
	if err != nil {
		log.Fatalf("Failed to navigate to the login page: %v", err)
	}

	cookie, err := driver.GetCookies()
	if err != nil {
		log.Fatal("Error:", err)
	}
	return utils.ParseCookie(cookie, "LEETCODE_SESSION"), utils.ParseCookie(cookie, "csrftoken")
}
