import logging
from flask import request

class CustomFormatter(logging.Formatter):
    def format(self, record):
        # Add route, method, and function name to the log record
        record.route = getattr(request, 'path', '-') if request else '-'
        record.method = getattr(request, 'method', '-') if request else '-'
        record.funcName = record.funcName
        return super().format(record)

log_format = '%(asctime)s - %(route)s - %(method)s - %(funcName)s - %(message)s'
handler = logging.StreamHandler()
handler.setFormatter(CustomFormatter(log_format))

def get_logger(name: str):
    logger = logging.getLogger(name)
    logger.handlers = []  # Remove default handlers
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger 