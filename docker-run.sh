#!/bin/sh
envsubst '$REQUEST_URL' < /etc/nginx/conf.d/default.template > /etc/nginx/nginx.conf
cat /etc/nginx/nginx.conf
nginx -g "daemon off;"
