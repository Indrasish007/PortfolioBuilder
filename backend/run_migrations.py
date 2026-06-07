import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.management import call_command

def check_and_migrate():
    print("Checking database columns for out-of-sync migrations...")
    table_exists = False
    column_exists = False
    try:
        with connection.cursor() as cursor:
            # First, check if the table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'portfolios_portfolio'
                );
            """)
            table_exists = cursor.fetchone()[0]
            
            if table_exists:
                # If table exists, check if the column exists
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='portfolios_portfolio' AND column_name='custom_seo_title';
                """)
                column_exists = cursor.fetchone() is not None
    except Exception as e:
        print(f"Error checking table/column existence: {e}")
        # Safeguard: if something fails, do not fake anything
        table_exists = False
        column_exists = False

    # We only fake if the table exists but the column is missing
    if table_exists and not column_exists:
        print("Table portfolios_portfolio exists but column custom_seo_title does not. Correcting migration state...")
        try:
            # Fake back to 0013 so Django thinks 0014 and 0015 are unapplied
            call_command('migrate', 'portfolios', '0013', fake=True, interactive=False)
            print("Successfully faked portfolios back to 0013.")
        except Exception as e:
            print(f"Failed to fake back to 0013: {e}")
            
    print("Running database migrations...")
    try:
        call_command('migrate', interactive=False)
        print("Migrations ran successfully.")
    except Exception as e:
        print(f"Error running migrations: {e}")

if __name__ == '__main__':
    check_and_migrate()
