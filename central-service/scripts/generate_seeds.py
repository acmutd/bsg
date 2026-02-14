import requests
import os
import csv
import io

# Configuration
API_URL = "https://leetcode.com/api/problems/all/"
CSV_FILE = "../../problems_data.csv"      # Intermediate CSV file
SQL_FILE = "../../seed_problems.sql"   # Final SQL file

def get_difficulty_string(level):
    """Maps LeetCode difficulty level (1, 2, 3) to our DB enum."""
    if level == 1: return 'Easy'
    if level == 2: return 'Medium'
    if level == 3: return 'Hard'
    return 'Medium'

def escape_sql(text):
    """Escapes single quotes for SQL insertion."""
    if not text: return ""
    return str(text).replace("'", "''").replace("\\", "\\\\")

def fetch_and_create_csv():
    """Step 1: Fetch data from API and save to CSV."""
    print(f"STEP 1: Fetching problems from {API_URL}...")
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return

    problems = data["stat_status_pairs"]
    print(f"Found {len(problems)} problems. Writing to CSV...")

    # Resolve paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    abs_csv_path = os.path.abspath(os.path.join(script_dir, CSV_FILE))

    with open(abs_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        # Header matching USER request + DB columns
        writer.writerow(["ID", "Title", "Link", "Difficulty", "Paid Only", "Status", "Slug", "Description", "Hints"])
        
        for item in problems:
            stat = item["stat"]
            
            # Extract fields
            question_id = stat["question_id"]
            title = stat["question__title"]
            slug = stat["question__title_slug"]
            link = f"https://leetcode.com/problems/{slug}/"
            
            # Map difficulty
            difficulty_num = item["difficulty"]["level"]
            difficulty_str = get_difficulty_string(difficulty_num)
            
            paid_only = item["paid_only"]
            status = item["status"]
            
            # Placeholders
            description = f"Practice problem: {title}."
            hints = "No hints available."
            
            # Write EVERYTHING to CSV
            writer.writerow([question_id, title, link, difficulty_str, paid_only, status, slug, description, hints])
            
    print(f"✅ CSV created at: {abs_csv_path}")
    print("   -> Includes extra columns (ID, Link, Status) for your reference.")

def convert_csv_to_sql():
    """Step 2: Read from CSV and generate SQL file (Selecting ONLY DB columns)."""
    print("STEP 2: Converting CSV to SQL script...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    abs_csv_path = os.path.abspath(os.path.join(script_dir, CSV_FILE))
    abs_sql_path = os.path.abspath(os.path.join(script_dir, SQL_FILE))

    if not os.path.exists(abs_csv_path):
        print(f"❌ CSV file not found at {abs_csv_path}. Run step 1 first.")
        return

    # Add CREATE TABLE to ensure it exists before INSERT logic runs in Docker entrypoint
    sql_header = """
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE,
    slug TEXT UNIQUE,
    description TEXT,
    hints TEXT,
    difficulty TEXT
);

INSERT INTO problems (name, slug, description, hints, difficulty) VALUES
"""
    values_list = []

    with open(abs_csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader) # Output: ["ID", "Title", "Link", "Difficulty", "Paid Only", "Status", "Slug", "Description", "Hints"]
        
        # Helper to find column index by name (robustness)
        try:
            idx_name = header.index("Title")
            idx_slug = header.index("Slug")
            idx_desc = header.index("Description")
            idx_hints = header.index("Hints")
            idx_diff = header.index("Difficulty")
        except ValueError as e:
            print(f"❌ CSV Header mismatch: {e}")
            return

        for row in reader:
            if not row: continue
            
            # Extract ONLY what the database needs
            name = escape_sql(row[idx_name])
            slug = escape_sql(row[idx_slug])
            desc = escape_sql(row[idx_desc])
            hints = escape_sql(row[idx_hints])
            diff = escape_sql(row[idx_diff])
            
            # ('Name', 'Slug', 'Desc', 'Hints', 'Diff')
            value_row = f"('{name}', '{slug}', '{desc}', '{hints}', '{diff}')"
            values_list.append(value_row)

    full_sql = sql_header + ",\n".join(values_list) + ";"

    with open(abs_sql_path, "w", encoding="utf-8") as f:
        f.write(full_sql)

    print(f"✅ SQL generated at: {abs_sql_path}")
    print(f"   -> Contains {len(values_list)} problems ready for database import.")

if __name__ == "__main__":
    # You can comment out Step 1 if you only want to process an existing CSV!
    fetch_and_create_csv()
    convert_csv_to_sql()
