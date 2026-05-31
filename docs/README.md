# FidusWriter-DHDConf

FidusWriter-DHDConf is a [Fidus Writer](https://github.com/fiduswriter/fiduswriter/) plugin used to organize collaborative writing for submissions to [DHD conferences](https://dig-hum.de).

Users can login with their [conftool](https://www.conftool.net/en/index.html) credentials.

## Setup

In your `configuration.py` add `dhdconf` to the list of installed apps:

```py
BASE_INSTALLED_APPS = []
INSTALLED_APPS = [
    "dhdconf",
    "npm_mjs",
    "base",
    "daphne",
    "django.contrib.admin",  
    "django.contrib.auth",
    "allauth.socialaccount",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.sites",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.admindocs",
    "django.contrib.flatpages",
    "channels",
    "axes",  # django-axes for brute-force protection (can be disabled via REMOVED_APPS)
    "django_otp",  # Two-factor authentication (can be disabled via REMOVED_APPS)
    "django_otp.plugins.otp_totp",
    "django_js_error_hook",
    "loginas",
    "fixturemedia",
    "browser_check",
    "menu",
    "document",
    "bibliography",
    "usermedia",
    "user",
    "allauth",
    "allauth.account",
    "avatar",
    "feedback",
    "style",
    "user_template_manager",
]

# A list of apps to remove from the default installation
# This is useful for disabling features you don't need
REMOVED_APPS = [
    # Example: Disable two-factor authentication entirely
    "django_otp",
    # Example: Disable brute-force protection (for development only)
    "axes",
    "django_otp.plugins.otp_totp",
]
```

The reason for explicitly adding all APPS to the list is that we have to
be sure that the Javascript files of our plugin are loaded first because
otherwise we can not overwrite the original files of FidusWriter. See
[here](./technicalaspects.md) for details.

In the same file add the authentication backend `ConftoolBackend` to allow login via conftool. In the same setting keep Djangos `ModelBackend` if you want to allow logins by users who are not registered in conftool (e.g. for admin accounts).

```py
AUTHENTICATION_BACKENDS = [
    "dhdconf.conftool.auth.ConftoolBackend",
    "django.contrib.auth.backends.ModelBackend",
]
```

We assume that users will login with their conftool credentials and email verification is handled by conftool. So we can adjust some authentication settings

```py
PASSWORD_LOGIN = True
REGISTRATION_OPEN = False
SOCIALACCOUNT_OPEN = False
ACCOUNT_EMAIL_VERIFICATION = "none"
```

Add our middleware which restrict access to some fidus functionality:

```py
MIDDLEWARE = [
    "dhdconf.middleware.RequestBlockingMiddleware"
]
```

Have a look at [app_settings.py](fiduswriter/dhdconf/app_settings.py) for our settings. You can override these in your `configuration.py`.

Run our setup task to finish the installation:

```sh
fiduswriter dhdconf_setup
```

## Local setup for development

For development pruposes you can clone the fiduswriter repoy and symlink this repo into it.

```sh
git clone git@github.com:fiduswriter/fiduswriter.git fiduswriter
cd fiduswriter

# Create a virtual environment and export env variables
python -m venv ./venv
cat <<-EOF >> venv/bin/activate
export CONFTOOL_URL=https://www.conftool.net/demo/dhdtest_26j/rest.php
export CONFTOOL_APIPASS=<apipass>
EOF
source venv/bin/activate

cd fiduswriter
pip install -r requirements.txt -r dev-requirements.txt -r test-requirements.txt -r postgresql-requirements.txt ipython

ln -s ../../fiduswriter-dhdconf-plugin/fiduswriter/dhdconf dhdconf

./manage.py migrate
./manage.py dhdconf_setup
./manage.py runserver
```

Run our tests with

```sh
./manage.py jest
./manage.py test dhdconf
```

If on sqlite locally, you need to add a `TEST` configuration in `configuration.py`:

```py
DATABASES = {
    "default": {
        ...
        "TEST": {
            "NAME": "/tmp/fidustest.sql"
        }
    }
}
```
