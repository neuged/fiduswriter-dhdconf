import json
from dataclasses import replace
from unittest.mock import patch

import django.utils.timezone
from allauth.account.models import EmailAddress
from django.db import IntegrityError
from django.test import TestCase

from dhdconf.conftool.api import (
    ConftoolClient,
    LoginResponse,
    UserInfoResponse,
    ConftoolLoginFailed,
    ExportUserResponse,
    ExportPaperResponse,
    PaperAuthor
)
from dhdconf.conftool.auth import ConftoolBackend
from dhdconf.conftool.importing import import_emails, import_paper
from dhdconf.models import ConftoolUser, ConftoolDocument, ImportLog
from user.models import User
from document.consumers import WebsocketConsumer
from document import prosemirror


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
        raise ConftoolLoginFailed()


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
        num_logs = ImportLog.objects.count()
        response = self.backend.authenticate(None, 'username', 'password')
        self.assertIsNone(response)
        self.assertEqual(ImportLog.objects.count(), num_logs + 1)
        log = ImportLog.objects.last()
        self.assertEqual(log.error_type, ImportLog.ErrorType.IMPORT_USERINFO)
        self.assertIn("IntegrityError", log.message)

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
        self.assertEqual(addr1.verified, True)
        self.assertEqual(addr2.verified, False)
        self.assertEqual(addr1.primary, True)
        self.assertEqual(addr2.primary, False)

    def test_reimporting_changed_emails(self):
        import_emails(self.data)
        import_emails(replace(self.data, email="c3@example.com", email2_validated=True))
        self.assertEqual(self.user.emailaddress_set.count(), 2, "previous replaced")
        addr2, addr3 = self.user.emailaddress_set.order_by("email").all()
        self.assertEqual(addr2.email, "c2@example.com")
        self.assertEqual(addr3.email, "c3@example.com")
        self.assertEqual(addr2.verified, True)
        self.assertEqual(addr3.verified, True)
        self.assertEqual(addr2.primary, False)
        self.assertEqual(addr3.primary, True)

    def test_importing_missing_emails(self):
        import_emails(replace(self.data, email2=""))
        self.assertEqual(self.user.emailaddress_set.count(), 1)
        self.assertEqual(self.user.emailaddress_set.first().email, "c1@example.com")
        self.assertEqual(self.user.emailaddress_set.first().primary, True)
        import_emails(replace(self.data, email=""))
        self.assertEqual(self.user.emailaddress_set.count(), 1)
        self.assertEqual(self.user.emailaddress_set.first().email, "c2@example.com")
        self.assertEqual(self.user.emailaddress_set.first().primary, True)


class ImportPaperTest(TestCase):

    def setUp(self):
        self.user = _user_factory()
        self.email = EmailAddress.objects.create(
            user=self.user, email="author1@example.com", verified=True
        )
        self.data = ExportPaperResponse(
            paper_id=234,
            submitting_author_id=123,
            title="paper title",
            topics=["t1", "t2"],
            keywords=["k1", "k2"],
            abstract="the\npaper\nabstract\n",
            contribution_type="Presentation",
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


class ImportPaperTestWithActiveEditorSession(TestCase):

    def setUp(self):
        self.user = _user_factory()
        self.email = EmailAddress.objects.create(
            user=self.user, email="author1@example.com", verified=True
        )
        self.data = ExportPaperResponse(
            paper_id=234,
            submitting_author_id=123,
            title="paper title",
            topics=["t1", "t2"],
            keywords=["k1", "k2"],
            abstract="the\npaper\nabstract\n",
            contribution_type="Presentation",
            authors=[
                PaperAuthor(
                    name="Jones, Alex",
                    organization="ORG",
                    email="author1@example.com",
                    orcid="0000-1234-2345-3456"
                )
            ]
        )
        # Import paper first to create the document
        self.document = import_paper(self.data)
        # Mock a WebSocket session for this document
        self.mock_session = {
            "doc": self.document,
            "node": prosemirror.from_json(self.document.content),
            "node_updates": False,
            "participants": {},
            "last_saved_version": self.document.version,
        }
        self.document.diffs = []  # Initialize diffs list
        WebsocketConsumer.sessions[self.document.pk] = self.mock_session

    def tearDown(self):
        # Clean up session
        if self.document and self.document.pk in WebsocketConsumer.sessions:
            del WebsocketConsumer.sessions[self.document.pk]

    def test_importing_creates_paper_with_attributes_when_session_active(self):
        # Import again with different data to trigger session update
        modified_data = replace(self.data,
            title="updated paper title",
            topics=["t3", "t4"],
            keywords=["k3", "k4"],
            abstract="updated abstract",
            contribution_type="Workshop",
            authors=[
                PaperAuthor(
                    name="Changed, Alex II.",
                    organization="ORG-updated",
                    email="author1-updated@example.com",
                    orcid="0000-1111-2222-3333"
                )
            ]
        )

        with patch.object(WebsocketConsumer, 'send_updates', return_value=None):
            import_paper(modified_data)

            # Verify session was updated
            session = WebsocketConsumer.sessions[self.document.pk]
            self.assertTrue(
                session["node_updates"],
                "node_updates should be True after session update"
            )
            self.assertGreater(
                session["doc"].version,
                self.mock_session["last_saved_version"],
                "Document version should be incremented"
            )
            self.assertTrue(
                len(session["doc"].diffs) > 0,
                "Diffs should be added to session"
            )

            node_content = prosemirror.to_mini_json(session["node"])
            content = json.dumps(node_content)
            self.assertIn(json.dumps("Workshop"), content)
            self.assertIn(json.dumps("updated paper title"), content)
            self.assertIn(json.dumps("t3"), content)
            self.assertIn(json.dumps("t4"), content)
            self.assertIn(json.dumps("k3"), content)
            self.assertIn(json.dumps("k4"), content)
            self.assertIn(json.dumps("updated abstract"), content)
            self.assertIn(json.dumps("Changed"), content)
            self.assertIn(json.dumps("Alex II."), content)
            self.assertIn(json.dumps("ORG-updated"), content)
            self.assertIn(json.dumps("author1-updated@example.com"), content)
            self.assertIn(json.dumps("0000-1111-2222-3333"), content)
