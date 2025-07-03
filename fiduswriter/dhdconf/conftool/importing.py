from copy import deepcopy
from typing import List

import django.utils.timezone
from allauth.account.models import EmailAddress
from allauth.account.utils import user_field, user_email, user_username
from django.contrib.contenttypes.models import ContentType
from django.db import transaction

from dhdconf.conftool.api import UserInfoResponse, ExportUserResponse, ExportPaperResponse
from dhdconf.document import ensure_dhd_document_template
from dhdconf.document.content import DhdDocumentContentUpdate
from dhdconf.models import ConftoolUser, ConftoolEmail, ConftoolDocument, ConftoolUserInvite, ConftoolAccessRight


@transaction.atomic
def import_user_info(user: ConftoolUser, info: UserInfoResponse):
    user_field(user, "first_name", info.firstname)
    user_field(user, "last_name", info.name)
    user_email(user, info.email)
    user_username(user, info.username)
    user.synchronized = django.utils.timezone.now()
    user.save()


def import_emails(data: ExportUserResponse):
    if not (user := ConftoolUser.objects.filter(conftool_id=data.person_id).first()):
        return
    user = user.user_ptr
    addresses = []
    for email, validated in [
        (data.email, data.email_validated),
        (data.email2, data.email2_validated)
    ]:
        if not email:
            continue
        email = email.lower()
        address = (
            ConftoolEmail.objects.filter(email=email, user=user).first()
            or ConftoolEmail(email=email, user=user)
        )
        address.verified = validated
        address.primary = False
        addresses.append(address)
    with transaction.atomic():
        for address in addresses:
            address.save()
        ids = [a.pk for a in addresses]
        ConftoolEmail.objects.filter(user=user).exclude(pk__in=ids).delete()
        if len(addresses) > 0:
            addresses[0].set_as_primary()
        _accept_invites(user, [a.email for a in addresses if a.verified])


def _accept_invites(user, verified_emails: List[str]):
    for cui in ConftoolUserInvite.objects.filter(email__in=verified_emails):
        cui.to = user
        cui.save()
        # apply() uses generic relations which need the un-extended model
        cui.userinvite_ptr.apply()


def import_paper(data: ExportPaperResponse):
    document = ConftoolDocument.objects.filter(conftool_id=data.paper_id).first()
    if not document:
        template = ensure_dhd_document_template()
        document = ConftoolDocument(conftool_id=data.paper_id, template=template)
        document.content = deepcopy(template.content)
    document.title = data.title
    document.path = ""
    document.owner = ConftoolUser.objects.filter(
        conftool_id=data.submitting_author_id
    ).first()

    content = DhdDocumentContentUpdate()
    content.set_title(data.title)
    content.set_contribution_type(data.contribution_type)
    content.set_keywords(data.keywords)
    content.set_topics(data.topics)
    content.set_abstract(data.abstract)
    for author in data.authors:
        content.add_contributor(
            firstname=author.firstname(),
            lastname=author.lastname(),
            email=author.email,
            institution=author.organization,
            orcid=author.orcid
        )
    with transaction.atomic():
        document.synchronized = django.utils.timezone.now()
        document.save()
        content.set_on(document)
        _synchronize_access_rights(document, [author.email for author in data.authors])
    return document


def _synchronize_access_rights(document: ConftoolDocument, emails: list[str]):
    rights = []
    invites = []
    emails = [email.lower() for email in emails if email]
    for email in emails:
        if local := EmailAddress.objects.filter(email=email, verified=True).first():
            holder = local.user
            holder_type = ContentType.objects.get(app_label="user", model="user")
            if holder not in list(document.owner.contacts.all()):
                document.owner.contacts.add(holder)
        else:
            holder, _ = ConftoolUserInvite.objects.get_or_create(
                email=email,
                username=email,
                by=document.owner,
            )
            holder_type = ContentType.objects.get(app_label="user", model="userinvite")
            invites.append(holder.pk)

        access_right, _ = ConftoolAccessRight.objects.get_or_create(
            document=document,
            holder_id=holder.id,
            holder_type=holder_type,
            rights="write"
        )
        rights.append(access_right.pk)
    # only leave those invites and access rights we just set up
    others = ConftoolUserInvite.objects.filter(email__in=emails).exclude(pk__in=invites)
    for invite in others:
        invite.userinvite_ptr.document_rights.clear()
        invite.delete()
    ConftoolAccessRight.objects.filter(document=document).exclude(pk__in=rights).delete()
