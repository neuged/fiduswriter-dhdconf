from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils.translation import gettext_lazy as _

from base.decorators import ajax_required
from dhdconf.conftool.api import ConftoolClient
from dhdconf.conftool.importing import import_paper, import_emails, import_user_info
from dhdconf.conftool.util import import_log_error, import_log
from dhdconf.models import ConftoolUser, ImportLog


ErrorType = ImportLog.ErrorType


def _client():
    return ConftoolClient(
        service_url=settings.CONFTOOL_URL,
        secret=settings.CONFTOOL_APIPASS,
    )

def _conftool_user(request):
    # A ConftoolUser should have been set on authentication, try to fetch one if not
    if request.user and request.user.pk:
        if getattr(request.user, "conftool_id", False):
            return request.user
        else:
            return ConftoolUser.objects.filter(pk=request.user.pk).first()
    else:
        return None


class UserMessage:
    OK_NO_PAPERS = _("No submissions to import")
    OK_ALL_PAPERS = _("Imported submissions")
    ERROR_SOME_PAPERS = _("Some submissions could not be imported correctly")
    ERROR_EXPORTING_PAPERS = _("Unable to retrieve submissions from conftool")
    OK_USERDATA = _("Imported user data")
    ERROR_USERDATA = _("Could not retrieve or import all user data")


@login_required
@ajax_required
@require_POST
def refresh_conftool_papers(request):
    ok = True
    failures = 0
    papers = []
    if user := _conftool_user(request):
        try:
            papers = _client().export_papers([user.conftool_id])
        except Exception as e:
            ok = False
            import_log_error(ErrorType.EXPORT_PAPERS, e, request)
        for paper in papers:
            try:
                import_paper(paper)
            except Exception as e:
                failures += 1
                ok = False
                import_log_error(ErrorType.IMPORT_PAPER, e, request, paper=paper)
        if ok:
            import_log(request, success=True)
            if len(papers) > 0:
                message = UserMessage.OK_ALL_PAPERS
            else:
                message = UserMessage.OK_NO_PAPERS
        else:
            if failures == 0:
                message = UserMessage.ERROR_EXPORTING_PAPERS
            else:
                message = UserMessage.ERROR_SOME_PAPERS
        return JsonResponse(
            data=dict(requestId=request.import_log_id, message=message),
            status=200 if ok else 500
        )
    else:
        return JsonResponse([], status=400)


@login_required
@ajax_required
@require_POST
def refresh_conftool_user(request):
    ok = True
    user_data = None
    user_info = None
    if user := _conftool_user(request):
        try:
            user_data = _client().export_user(user.conftool_id)
        except Exception as e:
            ok = False
            import_log_error(ErrorType.EXPORT_USER, e, request)
        if user_data:
            try:
                user_info = _client().user_info(user_data.username)
            except Exception as e:
                ok = False
                import_log_error(ErrorType.FETCH_USERINFO, e, request)
            try:
                import_emails(user_data)
            except Exception as e:
                ok = False
                import_log_error(ErrorType.IMPORT_EMAILS, e, request)
        if user_info:
            try:
                import_user_info(user, user_info)
            except Exception as e:
                ok = False
                import_log_error(ErrorType.IMPORT_USERINFO, e, request)
        if ok:
            import_log(request, success=True)
            message = UserMessage.OK_USERDATA
            unvalidated_emails = [i for i in [
                user_data.email if not user_data.email_validated else "",
                user_data.email2 if not user_data.email2_validated else "",
            ] if i]
        else:
            message = UserMessage.ERROR_USERDATA
            unvalidated_emails = []
        return JsonResponse(
            data=dict(
                requestId=request.import_log_id,
                message=message,
                unvalidatedEmails=unvalidated_emails,
            ),
            status=200 if ok else 500
        )
    else:
        return JsonResponse([], status=400)

