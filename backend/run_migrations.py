import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.management import call_command

def check_and_migrate():
    print("Checking database columns for out-of-sync migrations...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='portfolios_portfolio' AND column_name='custom_seo_title';
            """)
            exists = cursor.fetchone() is not None
    except Exception as e:
        print(f"Error checking column existence (might be database initialization): {e}")
        exists = True # Skip faking if we can't query the table yet

    if not exists:
        print("Column custom_seo_title does not exist in production database. Correcting migration state...")
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
