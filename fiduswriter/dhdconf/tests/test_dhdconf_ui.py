import time

import django.utils.timezone

from dhdconf.conftool.api import ExportPaperResponse, PaperAuthor
from dhdconf.conftool.importing import import_paper
from dhdconf.models import ConftoolUser
from testing.selenium_helper import SeleniumHelper
from channels.testing import ChannelsLiveServerTestCase
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class DhdconfViewsTest(SeleniumHelper, ChannelsLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        driver_data = cls.get_drivers(1)
        cls.driver = driver_data["drivers"][0]
        cls.client = driver_data["clients"][0]
        cls.driver.implicitly_wait(driver_data["wait_time"])
        cls.wait_time = driver_data["wait_time"]

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        super().tearDownClass()

    def setUp(self):
        self.base_url = self.live_server_url
        self.verificationErrors = []
        self.accept_next_alert = True
        # Hacky: Use a conftool user for paper import, then switch to a "normal" owner
        # so that we can use the regular login with a database password
        ConftoolUser.objects.create(
            conftool_id=100,
            synchronized=django.utils.timezone.now()
        )

        self.document =  import_paper(ExportPaperResponse(
            paper_id=100,
            submitting_author_id=100,
            title="Test Paper",
            abstract="Test Abstract",
            contribution_type="Contribution",
            keywords=["key1", "key2"],
            topics=["topic1", "topic2"],
            authors=[PaperAuthor(
                name="Author, Test",
                organization="Test University",
                email="test@example.com",
                orcid="0000-0002-2771-9344"
            )]
        ))
        self.user = self.create_user(
            username="Test", email="test@example.com", passtext="password123"
        )
        self.document.owner = self.user
        self.document.save()


    def tearDown(self):
        self.assertEqual([], self.verificationErrors)
        return super().tearDown()

    def assertAbsence(self, locator, message):
        self.driver.implicitly_wait(0)
        self.assertEqual(
            len(self.driver.find_elements(locator[0], locator[1])),
            0,
            message
        )
        self.driver.implicitly_wait(self.wait_time)

    def test_ui(self):
        driver = self.driver

        # Log in manually
        driver.get(f"{self.base_url}/")
        driver.find_element(By.ID, "id-login").send_keys("Test")
        driver.find_element(By.ID, "id-password").send_keys("password123")
        driver.find_element(By.ID, "login-submit").click()

        WebDriverWait(self.driver, self.wait_time).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(., 'Documents')]")
            ),
            "Documents menu item should be present"
        )

        # config.hideBibliographyMenu
        self.assertAbsence(
            (By.XPATH, "//a[contains(., 'Bibliography')]"),
            "Bibliography menu item should not be present"
        )

        # config.removeFolderCreationOption
        self.assertAbsence(
            (By.XPATH, "//button[contains(., 'new folder')]"),
            "Create new folder option should not be present"
        )

        # config.removeDocumenCreationOptions
        self.assertAbsence(
            (By.XPATH, "//button[contains(., 'Upload FIDUS')]"),
            "Import Fidus document option should not be present"
        )
        WebDriverWait(self.driver, timeout=0).until(
            EC.invisibility_of_element_located(
                (By.XPATH, "//button[contains(., 'Create new document')]")
            ),
            "Add document button should not be present"
        )

        # Navigate: /images
        WebDriverWait(self.driver, timeout=0).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(., 'Images')]")
            ),
        ).click()

        # config.removeCategoryOptionsFromImagesOverview
        self.assertAbsence(
            (By.XPATH, "//div[contains(., 'All categories')]"),
            "Category selector should not be present in Images overview"
        )
        self.assertAbsence(
            (By.XPATH, "//div[contains(., 'Edit categories')]"),
            "Edit categories option should not be present in Images overview"
        )

        # Navigate: Editor
        driver.get(f"{self.base_url}/")
        WebDriverWait(self.driver, self.wait_time).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(@href, '/document/')]")
            ),
            "Document should be present"
        ).click()

        # config.removeUniversalActionsFromTrackChangesMenu
        track_changes = WebDriverWait(self.driver, self.wait_time).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//span[contains(@class, 'header-nav-item') and contains(., 'changes')]")
            ),
        )
        track_changes.click()
        list_items = driver.find_elements(By.CLASS_NAME, "fw-pulldown-item")
        self.assertEqual(
            len(list_items), 1, "Only one option should be present in track changes"
        )
        track_changes.click()

        # config.removeDocumentSharingOptions
        file_menu = WebDriverWait(self.driver, self.wait_time).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//span[contains(@class, 'header-nav-item') and contains(., 'File')]")
            ),
        )
        file_menu.click()
        self.assertAbsence(
            (By.XPATH, "//span[contains(@class, 'fw-pulldown-item') and contains(., 'Share')]"),
            "Share option should not be present in File menu"
        )
        file_menu.click()

        # Visit export options
        def click_export(text):
            WebDriverWait(self.driver, self.wait_time).until(
                EC.element_to_be_clickable(
                    (By.XPATH, "//span[contains(@class, 'header-nav-item') and contains(., 'Export')]")
                ),
            ).click()
            WebDriverWait(self.driver, self.wait_time).until(
                EC.element_to_be_clickable(
                    (By.XPATH, f"//span[contains(@class, 'fw-pulldown-item') and contains(text(), '{text}')]")
                ),
                f"Should have export option: '{text}'"
            ).click()
            alert = WebDriverWait(self.driver, self.wait_time).until(
                EC.visibility_of_element_located(
                    (By.CLASS_NAME, "alerts-success")
                ),
                f"Should see success for option: '{text}'"
            )
            WebDriverWait(self.driver, self.wait_time).until(
                EC.invisibility_of_element(alert)
            )
        click_export("HTML")
        click_export("TEI")
        click_export("DHC")
