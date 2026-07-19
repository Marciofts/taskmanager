"""
Shared SQLAlchemy instance. Kept in its own module so both app.py and
models.py can import it without a circular import.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
