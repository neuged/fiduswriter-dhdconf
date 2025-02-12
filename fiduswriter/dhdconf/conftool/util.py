import traceback

from django.contrib.auth import get_user_model

from dhdconf.models import ImportLog

ErrorType = ImportLog.ErrorType
UserModel = get_user_model()


def import_log(request=None, paper=None, **kwargs) -> ImportLog:
    if request and not hasattr(request, 'import_log_id'):
        setattr(request, 'import_log_id', ImportLog.generate_request_id())
    log = ImportLog(
        request_id=request.import_log_id if request else None,
        user=request.user if request  and isinstance(request.user, UserModel) else None,
        path=request.path if request else None,
        conftool_paper_id=paper.paper_id if paper else None,
        **kwargs
    )
    log.save()
    return log


def import_log_error(error_type: ErrorType, error, request=None, **kwargs) -> ImportLog:
    return import_log(
        request=request,
        error_type=error_type,
        success=False,
        message=getattr(error, "message", repr(error)),
        stacktrace=''.join(traceback.TracebackException.from_exception(error).format()),
        **kwargs
    )
