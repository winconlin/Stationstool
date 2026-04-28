from playwright.sync_api import sync_playwright, expect
import os
import unittest

class TestMedicalSuite(unittest.TestCase):
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

        abs_path = os.path.abspath("medical_suite.html")
        self.page.goto(f"file://{abs_path}", wait_until="commit")
        self.page.add_style_tag(content=".hidden { display: none !important; }")

        # Ensure we are on the Epikrise tab
        self.page.click("#tab-btn-epikrise")

    def tearDown(self):
        self.page.close()

    def test_load_pvi_module(self):
        self.page.select_option("#moduleSelect", "pvi")
        self.page.wait_for_selector("#f_diag_type")

        self.page.select_option("#f_diag_type", "Long-standing VHF")

        # Use inner_value() for textarea
        def get_val():
            return self.page.locator("#epikrise-out").input_value()

        # Wait until it's not empty and contains the text
        self.page.wait_for_function("document.getElementById('epikrise-out').value.includes('Long-standing VHF')")
        self.assertTrue("Long-standing VHF" in get_val())

    def test_load_acs_module(self):
        self.page.select_option("#moduleSelect", "acs")
        self.page.wait_for_selector("#f_vessel")

        self.page.fill("#f_vessel", "RCX")

        self.page.wait_for_function("document.getElementById('epikrise-out').value.includes('KHK (RCX)')")
        self.assertTrue("KHK (RCX)" in self.page.locator("#epikrise-out").input_value())

if __name__ == "__main__":
    unittest.main()
