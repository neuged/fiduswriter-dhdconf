from django.apps import AppConfig


class DhdconfConfig(AppConfig):
    name = "dhdconf"
    default_auto_field = "django.db.models.AutoField"

    def ready(self):
        # Merge our settings with django's to make them outside-configurable
        from . import app_settings as defaults
        from django.conf import settings
        for name in dir(defaults):
            if name.isupper() and not hasattr(settings, name):
                setattr(settings, name, getattr(defaults, name))
