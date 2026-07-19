"""
Configuration for the Task Manager backend.

All secrets/connection info come from environment variables so nothing
sensitive is hardcoded in source control. In Azure App Service, set
these under Configuration > Application settings. Locally, put them
in a .env file (see .env.example).
"""

import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    # --- Database -----------------------------------------------------
    # Azure SQL connection string, e.g.:
    # mssql+pyodbc://USER:PASSWORD@YOUR-SERVER.database.windows.net:1433/YOUR-DB
    # ?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no
    #
    # If AZURE_SQL_CONNECTION_STRING is not set, we fall back to a local
    # SQLite file so the app is easy to run and test without Azure.
    AZURE_SQL_CONNECTION_STRING = os.environ.get("AZURE_SQL_CONNECTION_STRING")
    SQLALCHEMY_DATABASE_URI = AZURE_SQL_CONNECTION_STRING or "sqlite:///local_dev.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- App Insights ---------------------------------------------------
    APPINSIGHTS_CONNECTION_STRING = os.environ.get("APPINSIGHTS_CONNECTION_STRING")

    # --- Misc ------------------------------------------------------------
    PORT = int(os.environ.get("PORT", 8000))
