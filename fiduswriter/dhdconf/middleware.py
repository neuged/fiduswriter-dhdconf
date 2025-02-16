import django.conf
from django.http import HttpResponseForbidden
from django.urls import reverse

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
        ]
    }

    def __init__(self, get_response):
        self.get_response = get_response
        self.blocked = []
        for setting, paths in self.PATHS.items():
            if getattr(django.conf.settings, setting, False):
                for path in paths:
                    self.blocked.append(reverse(path))

    def __call__(self, request):
        if request.method == "POST" and request.path_info in self.blocked:
            return HttpResponseForbidden()
        else:
            return self.get_response(request)
