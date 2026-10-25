from playwright.sync_api import sync_playwright, expect
import os
import unittest

class TestSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(headless=True)
        cls.context = cls.browser.new_context()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.page = self.context.new_page()
        # Block external resources
        self.page.route("https://cdn.tailwindcss.com", lambda route: route.abort())
        self.page.route("**/*.{png,jpg,jpeg,woff2,woff,ttf}", lambda route: route.abort())
        self.page.route("https://fonts.googleapis.com/**", lambda route: route.abort())

        abs_path = os.path.abspath("Station.html")
        self.page.goto(f"file://{abs_path}", wait_until="domcontentloaded")
        self.page.add_style_tag(content=".hidden { display: none !important; }")

    def tearDown(self):
        self.page.close()

    def test_parsePasteData_xss_mitigation(self):
        # Open import modal
        self.page.click("button:has-text('KIS-Import')")

        # Malicious input
        # Note: must match the tabular format logic to bypass name regex
        header = "Fallnummer\tGeburtsdatum\tName"
        payload = "12345678\t01.01.2000\t<b id='xss-probe'>XSS</b>"
        input_text = f"{header}\n{payload}"

        self.page.fill("#pasteArea", input_text)

        # Check if the probe element exists in the preview
        probe = self.page.locator("#xss-probe")
        self.assertFalse(probe.is_visible(), "XSS probe element should NOT be visible")

        # Check if the content is escaped
        preview = self.page.locator("#importPreview")
        html = preview.inner_html()
        self.assertTrue("&lt;b id='xss-probe'&gt;XSS&lt;/b&gt;" in html)

    def test_attribute_xss_mitigation(self):
        # Add a patient with a name that tries to break out of an attribute
        self.page.click("button:has-text('+ Patient')")
        # Find the last patient name input
        name_input = self.page.locator("input[placeholder='Name']").last
        malicious_name = 'Test" onmouseover="alert(1)"'
        name_input.fill(malicious_name)
        name_input.press("Enter")
        self.page.wait_for_timeout(500)

        # Check the rendered HTML
        card = self.page.locator(".patient-card").last
        html = card.inner_html()
        # The value should be escaped in the input field
        self.assertTrue('value="Test&quot; onmouseover=&quot;alert(1)&quot;"' in html)
        # Ensure no actual onmouseover was injected (though Playwright might not show it in inner_html if it's invalid,
        # but here we check it's escaped)
        self.assertFalse('onmouseover="alert(1)"' in html)

    def test_medical_suite_single_quote_fix(self):
        # Go to medical suite
        abs_path = os.path.abspath("medical_suite.html")
        self.page.goto(f"file://{abs_path}")
        self.page.add_style_tag(content=".hidden { display: none !important; }")

        # Check if a button with a single quote in name works
        # We need to find a way to inject or find a block with a quote.
        # Let's check the ANAMNESE_BLOCKS via console
        self.page.evaluate("""
            ANAMNESE_BLOCKS["TestCategory"] = [{t: "Alzheimer's", s: "Dementia"}];
            renderAnamneseBuilder();
        """)
        self.page.wait_for_timeout(500)

        # Click the button
        self.page.click("button:has-text(\"Alzheimer's\")")
        self.page.wait_for_timeout(500)

        # Check if text was added to textarea
        val = self.page.locator("#anamnese-out").input_value()
        self.assertTrue("Alzheimer's" in val)

if __name__ == "__main__":
    unittest.main()
