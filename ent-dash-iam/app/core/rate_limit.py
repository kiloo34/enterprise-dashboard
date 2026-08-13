from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize the slowapi Limiter
# By default, this uses an in-memory storage. 
# We can easily swap it out for a Redis storage if scaling horizontally.
limiter = Limiter(key_func=get_remote_address)
