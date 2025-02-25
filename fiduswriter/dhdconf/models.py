from allauth.account.models import EmailAddress
from django.contrib.auth import get_user_model
from django.db import models
from django.utils.crypto import get_random_string

from document.models import Document, AccessRight
from user.models import UserInvite

UserModel = get_user_model()


class ConftoolUser(UserModel):
    conftool_id = models.PositiveBigIntegerField(unique=True)
    synchronized = models.DateTimeField()


class ConftoolDocument(Document):
    conftool_id = models.PositiveBigIntegerField(unique=True)
    synchronized = models.DateTimeField()


class ConftoolEmail(EmailAddress):
    pass


class ConftoolUserInvite(UserInvite):
    pass


class ConftoolAccessRight(AccessRight):
    pass


class ImportLog(models.Model):
    REQUEST_ID_LENGTH = 8

    class ErrorType(models.TextChoices):
        FETCH_LOGIN = "FL", "Fetch Login"
        FETCH_USERINFO = "FU", "Fetch Userdata"
        EXPORT_USER = "EU", "Export User"
        EXPORT_PAPERS = "EP", "Export Papers"
        IMPORT_USERINFO = "IU", "Import Userdata"
        IMPORT_EMAILS = "IE", "Import User Emails"
        IMPORT_PAPER = "IP", "Import Paper"

    request_id = models.CharField(max_length=REQUEST_ID_LENGTH, db_index=True, blank=True, null=True)
    path = models.CharField(max_length=80, db_index=True, blank=True, null=True)
    success = models.BooleanField(default=False, db_index=True)
    error_type = models.CharField(max_length=2, choices=ErrorType.choices, blank=True)
    user = models.ForeignKey(UserModel, blank=True, null=True, on_delete=models.CASCADE)
    message = models.TextField(blank=True, null=True, db_index=True)
    conftool_paper_id = models.PositiveBigIntegerField(blank=True, null=True)
    stacktrace = models.TextField(blank=True, null=True)
    added = models.DateTimeField(auto_now_add=True)

    @classmethod
    def generate_request_id(cls):
        return get_random_string(
            length=cls.REQUEST_ID_LENGTH,
            allowed_chars="ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
        )
