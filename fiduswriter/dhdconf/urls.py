from django.urls import path

from . import views

urlpatterns = [
    path(
        "refresh_conftool_papers/",
        views.refresh_conftool_papers,
        name="refresh_conftool_papers"
    ),
    path(
        "refresh_conftool_user/",
        views.refresh_conftool_user,
        name="refresh_conftool_user"
    ),
    path(
        "tei_export_settings",
        views.tei_export_settings,
        name="tei_export_settings"
    )
]
