import json
from dataclasses import replace
from unittest.mock import patch

import django.utils.timezone
from allauth.account.models import EmailAddress
from django.db import IntegrityError
from django.test import TestCase

from dhdconf.conftool.api import ConftoolClient, LoginResponse, UserInfoResponse, ConftoolLoginFailedException, \
    ExportUserResponse, ExportPaperResponse, PaperAuthor
from dhdconf.conftool.auth import ConftoolBackend
from dhdconf.conftool.importing import import_emails, import_paper
from dhdconf.models import ConftoolUser, ConftoolEmail, ConftoolDocument
from user.models import User


# TODO
# see https://github.com/fiduswriter/fiduswriter-pandoc/blob/main/fiduswriter/pandoc/tests/
# for mocking requests see: https://stackoverflow.com/a/65437794/1879728


def _user_factory() -> ConftoolUser:
    return ConftoolUser.objects.create(
        username="username",
        conftool_id=123,
        synchronized=django.utils.timezone.now(),
    )


def _mock_login(_, username, password):
    if username == 'username' and password == 'password':
        return LoginResponse(True, 123, 'username')
    else:
        raise ConftoolLoginFailedException()


def _mock_user_info(a, b):
    return UserInfoResponse(
        person_id=123,
        username='username',
        firstname='User',
        name='Name',
        email='user@example.com'
    )

def _mock_user_export(a, b):
    return ExportUserResponse(
        person_id=123,
        username='username',
        email='user@example.com',
        email_validated=True,
    )


@patch.object(ConftoolClient, 'login', _mock_login)
@patch.object(ConftoolClient, 'user_info', _mock_user_info)
@patch.object(ConftoolClient, 'export_user', _mock_user_export)
class AuthenticationTest(TestCase):

    def setUp(self):
        self.backend = ConftoolBackend()

    def test_successful_authentication(self):
        user = self.backend.authenticate(None, 'username', 'password')
        self.assertIsNotNone(user)
        self.assertIsNotNone(user.pk)
        self.assertIsInstance(user, User)
        self.assertIsNotNone(user.conftooluser)
        self.assertEqual(user.conftooluser.conftool_id, 123)
        self.assertEqual(user.get_username(), 'username')
        self.assertEqual(getattr(user, 'first_name'), 'User')
        self.assertEqual(getattr(user, 'last_name'), 'Name')
        self.assertEqual(getattr(user, 'email'), 'user@example.com')

    def test_unsuccessful_authentication(self):
        user = self.backend.authenticate(None, 'username', 'wrong-password')
        self.assertIsNone(user)

    def test_preexisting_user(self):
        local_user = User.objects.create(username='username')
        self.assertIsNotNone(local_user.pk)
        with self.assertRaises(IntegrityError):
            self.backend.authenticate(None, 'username', 'password')


    def test_that_email_is_created(self):
        # TODO
        pass


class ImportEmailAddressTest(TestCase):

    def setUp(self):
        self.user = _user_factory()
        self.data = ExportUserResponse(
            person_id=123,
            username="username",
            email="c1@example.com",
            email2="c2@example.com",
            email_validated=True,
            email2_validated=False
        )

    def test_importing_emails(self):
        import_emails(self.data)
        self.assertEqual(self.user.emailaddress_set.count(), 2)
        addr1, addr2 = self.user.emailaddress_set.order_by("email").all()
        self.assertEqual(addr1.email, "c1@example.com")
        self.assertEqual(addr2.email, "c2@example.com")
        self.assertEquals(addr1.verified, True)
        self.assertEquals(addr2.verified, False)
        self.assertEquals(addr1.primary, True)
        self.assertEquals(addr2.primary, False)

    def test_reimporting_changed_emails(self):
        import_emails(self.data)
        import_emails(replace(self.data, email="c3@example.com", email2_validated=True))
        self.assertEqual(self.user.emailaddress_set.count(), 2, "previous replaced")
        addr2, addr3 = self.user.emailaddress_set.order_by("email").all()
        self.assertEqual(addr2.email, "c2@example.com")
        self.assertEqual(addr3.email, "c3@example.com")
        self.assertEquals(addr2.verified, True)
        self.assertEquals(addr3.verified, True)
        self.assertEquals(addr2.primary, False)
        self.assertEquals(addr3.primary, True)

    def test_importing_missing_emails(self):
        import_emails(replace(self.data, email2=""))
        self.assertEqual(self.user.emailaddress_set.count(), 1)
        self.assertEqual(self.user.emailaddress_set.first().email, "c1@example.com")
        self.assertEqual(self.user.emailaddress_set.first().primary, True)
        import_emails(replace(self.data, email=""))
        self.assertEqual(self.user.emailaddress_set.count(), 1)
        self.assertEqual(self.user.emailaddress_set.first().email, "c2@example.com")
        self.assertEqual(self.user.emailaddress_set.first().primary, True)

    def test_importing_emails_does_not_replace_non_conftool_emails(self):
        EmailAddress.objects.create(user=self.user, email="other@example.com")
        import_emails(self.data)
        emails = self.user.emailaddress_set
        self.assertEqual(emails.count(), 3)
        self.assertTrue(emails.filter(email="other@example.com").exists())


class ImportPaperTest(TestCase):

    def setUp(self):
        self.user = _user_factory()
        self.email = ConftoolEmail.objects.create(
            user=self.user, email="author1@example.com", verified=True
        )
        self.data = ExportPaperResponse(
            paper_id=234,
            submitting_author_id=123,
            title="paper title",
            topics=["t1", "t2"],
            keywords=["k1", "k2"],
            abstract="the\npaper\nabstract\n",
            authors=[
                PaperAuthor(
                    name="Jones, Alex",
                    organization="ORG",
                    email="author1@example.com",
                    orcid="0000-1234-2345-3456"
                )
            ]
        )

    def test_importing_creates_paper_with_attributes(self):
        import_paper(self.data)
        doc = ConftoolDocument.objects.filter(conftool_id=234).first()
        self.assertIsNotNone(doc)
        self.assertEqual(doc.owner.pk, self.user.pk)
        self.assertEqual(doc.title, "paper title")
        content = json.dumps(doc.content)
        self.assertIn(json.dumps("paper title"), content)
        self.assertIn(json.dumps("t1"), content)
        self.assertIn(json.dumps("t2"), content)
        self.assertIn(json.dumps("k1"), content)
        self.assertIn(json.dumps("k2"), content)
        self.assertIn(json.dumps("the\npaper\nabstract\n"), content)
        self.assertIn(json.dumps("Jones"), content)
        self.assertIn(json.dumps("Alex"), content)
        self.assertIn(json.dumps("ORG"), content)
        self.assertIn(json.dumps("author1@example.com"), content)
        self.assertIn(json.dumps("0000-1234-2345-3456"), content)

    def test_that_user_invite_is_applied(self):
        # TODO
        pass

    def test_that_user_invite_is_only_applied_with_verified_email(self):
        # TODO
        pass
