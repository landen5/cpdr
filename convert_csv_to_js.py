# This is a helper script to convert your CSV data into a JavaScript variable.
# You only need to run this once.

import pandas as pd

# The clean CSV file we created in the last step
csv_file_path = 'cpdr_published_cases.csv'

try:
    # Read the CSV file into a string
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        csv_content = f.read()

    # --- Print the output in a format ready for JavaScript ---
    
    print("--- STEP 1: Copy the text below this line ---")
    print("--------------------------------------------------")
    
    # We wrap the CSV string in backticks (`) to create a JavaScript template literal,
    # which makes it easy to handle multi-line strings.
    print(f"const csvData = `{csv_content}`;")
    
    print("--------------------------------------------------")
    print("--- STEP 2: Paste it into your HTML file's script tag ---")

except FileNotFoundError:
    print(f"Error: The file '{csv_file_path}' was not found. Make sure it's in the same directory.")
except Exception as e:
    print(f"An error occurred: {e}")