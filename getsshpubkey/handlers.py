import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
import os

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        f = open(os.path.expanduser("~/.ssh/id_rsa.pub"), "r")
        self.finish(json.dumps({
            "data": f.read()
        }))

def setup_handlers(web_app):
    print("got inside setup handlers")
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "getsshpubkey", "get_ssh_pub_key")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
