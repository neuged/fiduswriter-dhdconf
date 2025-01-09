import abc
import hashlib
import logging
import time
from dataclasses import dataclass
from typing import Iterable, List

import requests
import xml.etree.ElementTree as ET


logger = logging.getLogger(__name__)


class ConftoolException(Exception):
    pass


class ConftoolAccessDeniedException(ConftoolException):
    pass


class ConftoolNonceTooSmallException(ConftoolAccessDeniedException):
    pass


class ConftoolLoginFailedException(ConftoolException):
    pass


class ConftoolUnknownUserException(ConftoolException):
    pass


class ConftoolUnexpectedResponse(ConftoolException):
    pass


class MissingElementException(ConftoolUnexpectedResponse):
    def __init__(self, element: ET.Element, tagname: str):
        super().__init__(f"Missing element '{element.tag}/{tagname}'")


class ExpectedIntegerException(ConftoolUnexpectedResponse):
    def __init__(self, element: ET.Element, tagname: str):
        super().__init__(f"Expected integer at '{element.tag}/{tagname}'")


class UnexpectedUserIdException(ConftoolUnexpectedResponse):
    # The conftool API allows filtering for user-specific results using the form_userID
    # param. If this param is set to a value that is not an actual user id in conftools
    # database, no filtering at all is performed and a complete export is returned
    # instead of an empty response. This error should be raised in that condition.
    def __init__(self, export_select, ids):
        super().__init__(f"Unexpected user id on filtering {export_select} for: {ids}")


def _t(element: ET.Element, child_tag: str, default=None) -> str:
    if (child := element.find(child_tag)) is not None:
        return child.text.strip() if child.text else ""
    elif default is not None:
        return default
    else:
        raise MissingElementException(element, child_tag)


def _int(element: ET.Element, child_tag: str) -> int:
    try:
        return int(_t(element, child_tag))
    except ValueError:
        raise ExpectedIntegerException(element, child_tag)


def _bool(element: ET.Element, child_tag: str) -> bool:
    return _t(element, child_tag, "").lower() in ["true", "1"]


def _list(element: ET.Element, child_tag: str, delim=",") -> List[str]:
    return [i.strip() for i in _t(element, child_tag, "").split(delim) if i]


class ConftoolResponse(abc.ABC):
    @classmethod
    @abc.abstractmethod
    def from_xml(cls, element: ET.Element) -> "ConftoolResponse":
        pass


@dataclass
class LoginResponse(ConftoolResponse):
    result: bool
    id: int
    username: str

    @classmethod
    def from_xml(cls, element: ET.Element) -> "LoginResponse":
        return cls(
            result=_bool(element, "result"),
            id=_int(element, "id"),
            username=_t(element, "username"),
        )


@dataclass
class UserInfoResponse(ConftoolResponse):
    person_id: int
    name: str
    firstname: str
    email: str

    @classmethod
    def from_xml(cls, element: ET.Element) -> "UserInfoResponse":
        return cls(
            person_id=int(_t(element, "personID")),
            name=_t(element, "name"),
            firstname=_t(element, "firstname"),
            email=_t(element, "email"),
        )


@dataclass
class ExportUserResponse(ConftoolResponse):
    person_id: int
    email: str
    email_validated: bool
    email2: str = ""
    email2_validated: bool = False

    @classmethod
    def from_xml(cls, element: ET.Element) -> "ExportUserResponse":
        result = cls(
            person_id=_int(element, "personID"),
            email=_t(element, "email"),
            email2=_t(element, "email2", ""),
            email_validated=_bool(element, "email_validated"),
            email2_validated=_bool(element, "email2_validated"),
        )
        return result


@dataclass
class PaperAuthor:
    name: str
    organization: str
    email: str
    orcid: str

    @classmethod
    def list_from_xml(cls, element: ET.Element) -> List["PaperAuthor"]:
        field = "authors_formatted_{}_{}"
        result = []
        idx = 1
        while name := _t(element, field.format(idx, "name"), ""):
            result.append(PaperAuthor(
                name=name,
                organization=_t(element, field.format(idx, "organization"), ""),
                email=_t(element, field.format(idx, "email"), ""),
                orcid=_t(element, field.format(idx, "orcid"), ""),
            ))
            idx += 1
        return result


@dataclass
class ExportPaperResponse(ConftoolResponse):
    paper_id: int
    submitting_author_id: int
    title: str
    abstract: str
    keywords: List[str]
    topics: List[str]
    authors: List[PaperAuthor]

    @classmethod
    def from_xml(cls, element: ET.Element) -> "ExportPaperResponse":
        return cls(
            paper_id=_int(element, "paperID"),
            submitting_author_id=_int(element, "submitting_author_ID"),
            title=_t(element, "title"),
            abstract=_t(element, "abstract", ""),
            keywords=_list(element, "keyword"),
            topics=_list(element, "topics"),
            authors=PaperAuthor.list_from_xml(element)
        )


class ConftoolClient:

    _HEADERS = { "User-Agent": "fiduswriter-dhdconf-plugin ConftoolClient 0.1" }

    def __init__(self, service_url: str, secret: str):
        self.service_url = service_url
        self.secret = secret

    def _nonce(self) -> int:
        # Conftool only requires a monotonically increasing integer for a nonce:
        # https://www.conftool.net/ctforum/index.php/topic,280.0.html
        # But we need to use the same nonce creation method as dhconvalidator to not
        # interfere, for context see: https://github.com/ADHO/dhconvalidator/issues/72
        # This can be simplified to `time.time_ns()` if we no longer need to cooperate
        return (time.time_ns() // 1_000_000) * 60

    def _nonce_with_hash(self) -> dict:
        nonce = str(self._nonce())
        return dict(
            nonce=nonce,
            passhash=hashlib.sha256((nonce + self.secret).encode('utf-8')).hexdigest()
        )

    def _do_request(self, params, stream=False):
        params = {**params, **self._nonce_with_hash()}
        result = requests.get(
            self.service_url, headers=self._HEADERS, params=params, stream=stream
        )
        return result

    @staticmethod
    def _raise_on_api_error(elem: ET.Element):
        if elem.tag in ["rest", "login", "request"]:
            if _t(elem, "result", "") == "false":
                message = _t(elem, "message", "")
                if message.startswith("access denied"):
                    if "nonce must be bigger" in message:
                        raise ConftoolNonceTooSmallException(message)
                    else:
                        raise ConftoolAccessDeniedException(message)
                elif message.startswith("login failed"):
                    raise ConftoolLoginFailedException(message)
                elif message.startswith("user name unknown"):
                    raise ConftoolUnknownUserException(message)
                else:
                    raise ConftoolUnexpectedResponse(message)

    def _request_xml(self, params) -> ET.Element:
        response = self._do_request(params)
        parsed = ET.fromstring(response.text)
        self._raise_on_api_error(parsed)
        return parsed

    def _stream_xml(self, params, target_tag, parent_tag) -> Iterable[ET.Element]:
        # this streams responses and cleans up memory directly after yielding them in
        # order to handle larger response bodies with minimum overhead
        with self._do_request(params, stream=True) as response:
            parent = None
            for action, elem in ET.iterparse(response.raw, events=("start", "end")):
                if elem.tag == parent_tag:
                    if action == "start":
                        parent = elem
                    elif action == "end":
                        parent.clear()
                        parent = None
                if action == "end":
                    self._raise_on_api_error(elem)
                    if elem.tag == target_tag:
                        yield elem
                        elem.clear()
                        if parent:
                            parent.remove(elem)

    def login(self, username, password) -> LoginResponse:
        response = self._request_xml(dict(
            page="remoteLogin",
            command="login",
            user=username,
            password=password,
        ))
        return LoginResponse.from_xml(response)

    def user_info(self, username) -> UserInfoResponse:
        response = self._request_xml(dict(
            page="remoteLogin",
            command="request",
            user=username,
        ))
        return UserInfoResponse.from_xml(response.find("user"))

    @staticmethod
    def _export_params(select="papers", user_ids=None, **additional_params) -> dict:
        params = {
            "export_select": select,
            "page": "adminExport",
            "cmd_create_export": "true",
            "form_include_deleted": "0",
            "form_export_format": "xml_short",  # or: "xml", "csv"
            "form_export_header": "default",
        }
        if user_ids is not None:
            params["form_userID"] = ','.join(str(i) for i in user_ids)
        return {**params, **additional_params}

    def export_user(self, user_id: int) -> ExportUserResponse:
        return next(i for i in self.export_users([user_id]) if i.person_id == user_id)

    def export_users(self, user_ids=None) -> Iterable[ExportUserResponse]:
        return list(self.stream_users(user_ids=user_ids))

    def stream_users(self, user_ids=None) -> Iterable[ExportUserResponse]:
        params = self._export_params(select="users", user_ids=user_ids, **{
            "form_export_users_options[]": [
                "extended"
            ]
        })
        for element in self._stream_xml(params, "user", "users"):
            response = ExportUserResponse.from_xml(element)
            if user_ids and response.person_id not in user_ids:
                raise UnexpectedUserIdException("users", user_ids)
            yield response

    def export_papers(self, user_ids=None) -> Iterable[ExportPaperResponse]:
        return list(self.stream_papers(user_ids=user_ids))

    def stream_papers(self, user_ids=None) -> Iterable[ExportPaperResponse]:
        params = self._export_params(select="papers", user_ids=user_ids, **{
            "form_export_papers_options[]": [
                "abstracts",
                "authors_extended_columns",
                "submitter"
            ]
        })
        for element in self._stream_xml(params, "paper", "papers"):
            response = ExportPaperResponse.from_xml(element)
            if user_ids and response.submitting_author_id not in user_ids:
                raise UnexpectedUserIdException("papers", user_ids)
            yield response
