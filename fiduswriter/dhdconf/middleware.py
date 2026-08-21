import django.conf
from django.http import HttpResponseForbidden
from django.urls import reverse

import allauth.account.views
import bibliography.views
import document.views
import user.views
import usermedia.views


class RequestBlockingMiddleware:

    PATHS = {
        "BLOCK_USER_CHANGES": [
            user.views.password_change,
            user.views.add_email,
            user.views.delete_email,
            user.views.primary_email,
            user.views.delete_socialaccount,
            user.views.save_profile,
        ],
        "BLOCK_NEW_DOCUMENT": [
            document.views.create_doc,
            document.views.import_create,
            document.views.import_doc,
        ],
        "BLOCK_USERMEDIA_CATEGORIES": [
            usermedia.views.save_category,

        ],
        "BLOCK_BIBLIO_CATEGORIES" : [
            bibliography.views.save_category,
            bibliography.views.delete_category
        ],
        "BLOCK_DOCUMENT_SHARING": [
            document.views.save_access_rights,
            user.views.invites_add,
            user.views.invite,
            user.views.invites_accept,
            user.views.invites_decline,
        ],
        "BLOCK_ALLAUTH_ROUTES": [
            allauth.account.views.email,
            allauth.account.views.password_reset,
            allauth.account.views.signup,
        ]
    }

    RAW_PATHS = {
        "BLOCK_USER_CHANGES": [
            "/api/user/password/reset/"
        ]
    }


    def __init__(self, get_response):
        self.get_response = get_response
        self.blocked = []

        for setting, paths in self.PATHS.items():
            if getattr(django.conf.settings, setting, False):
                for path in paths:
                    self.blocked.append(reverse(path))

        for setting, raw_paths in self.RAW_PATHS.items():
            if getattr(django.conf.settings, setting, False):
                for raw_path in raw_paths:
                    self.blocked.append(raw_path)

    def __call__(self, request):
        if request.method == "POST" and request.path_info in self.blocked:
            return HttpResponseForbidden()
        else:
            return self.get_response(request)
