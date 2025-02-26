from django.contrib.auth.backends import BaseBackend
from django.conf import settings

from dhdconf.conftool.api import ConftoolClient, ConftoolLoginFailedException
from dhdconf.conftool.importing import import_user_info
from dhdconf.models import ConftoolUser, ImportLog
from dhdconf.conftool.util import import_log_error


class ConftoolBackend(BaseBackend):

    def __init__(self):
        self.client = ConftoolClient(
            service_url=settings.CONFTOOL_URL,
            secret=settings.CONFTOOL_APIPASS,
        )
        super().__init__()

    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            response = self.client.login(username, password)
        except ConftoolLoginFailedException:
            return None
        if response.result:
            user = ConftoolUser.objects.filter(conftool_id=response.id).first()
            if not user:
                user = ConftoolUser(conftool_id=response.id)
                user.set_unusable_password()
                try:
                    info = self.client.user_info(response.username)
                    try:
                        import_user_info(user, info)
                    except Exception as e:
                        import_log_error(ImportLog.ErrorType.IMPORT_USERINFO, e, request)
                        raise e
                except Exception as e:
                    import_log_error(ImportLog.ErrorType.FETCH_USERINFO, e, request)
                    raise e
            return user.user_ptr
        else:
            return None

    def get_user(self, user_id):
        user = ConftoolUser.objects.filter(id=user_id).first()
        return user.user_ptr if user else None
