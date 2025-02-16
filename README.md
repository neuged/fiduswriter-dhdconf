# FidusWriter-DHDConf

FidusWriter-DHDConf is a [Fidus Writer](https://github.com/fiduswriter/fiduswriter/) plugin used to organize collaborative writing for submissions to [DHD conferences](https://dig-hum.de).

Users can login with their [conftool]() credentials.

## Setup

In your `configuration.py` add `dhdconf` to the list of installed apps:

```py
INSTALLED_APPS = [
	...
    "dhdconf"
]
```

In the same file add the authentication backend `ConftoolBackend`.

You can keep Djangos `ModelBackend` if you want to allow logins by users who are not registered in conftool (e.g. for admin accounts and logins via the admin).

```py
AUTHENTICATION_BACKENDS = [
    "dhdconf.conftool.auth.ConftoolBackend",
    "django.contrib.auth.backends.ModelBackend",
]
```

This plugin further assumes that all non-admin users will login with their conftool credentials and email verification is handled on the confttol side. The following settings reflect this. Setting these to different values is not recommended.

```py
PASSWORD_LOGIN = True
REGISTRATION_OPEN = False
SOCIALACCOUNT_OPEN = False
ACCOUNT_EMAIL_VERIFICATION = "none"
```

Add a middleware setting:

```py
MIDDLEWARE = [
    "dhdconf.middleware.RequestBlockingMiddleware"
]
```
