from functools import wraps
import json
from flask import jsonify, current_app
from utils.logger import get_logger

logger = get_logger(__name__)

def redis_cache(key_func, timeout=60):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            redis_client = current_app.redis_client
            cache_key = key_func(*args, **kwargs)
            cached_result = redis_client.get(cache_key)
            if cached_result is not None:
                logger.info(f"Cache HIT for key: {cache_key}")
                data, status = json.loads(cached_result)
                return jsonify(data), status
            logger.info(f"Cache MISS for key: {cache_key}")
            result = func(*args, **kwargs)
            # Only cache successful responses (status 200)
            if isinstance(result, tuple) and len(result) > 1 and result[1] == 200:
                response, status = result
                if hasattr(response, 'get_json'):
                    data = response.get_json()
                else:
                    data = response
                redis_client.set(cache_key, json.dumps([data, status]), ex=timeout)
                logger.info(f"Cache SET for key: {cache_key} (timeout={timeout}s)")
            return result
        return wrapper
    return decorator 