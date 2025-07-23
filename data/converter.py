import xml.etree.ElementTree as ET
import csv
import pandas as pd

def create_clean_csv_from_wordpress_export(xml_path, csv_path):
    """
    Parses a WordPress XML file, correctly filtering for published 'cpdr' posts,
    and saves the clean data to a CSV file ready for analysis.

    Args:
        xml_path (str): The file path of the WordPress XML export.
        csv_path (str): The desired file path for the output CSV.
    """
    namespaces = {
        'wp': 'http://wordpress.org/export/1.2/',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'content': 'http://purl.org/rss/1.0/modules/content/'
    }

    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
    except (ET.ParseError, FileNotFoundError) as e:
        print(f"Error: Could not read or parse the XML file at {xml_path}. {e}")
        return

    all_items_data = []

    for item in root.findall('.//item'):
        
        # === Critical Filters: Only process live, published cases ===
        post_type_element = item.find('wp:post_type', namespaces)
        if post_type_element is None or post_type_element.text != 'cpdr':
            continue

        status_element = item.find('wp:status', namespaces)
        if status_element is None or status_element.text != 'publish':
            continue

        item_data = {}
        
        # --- Basic Info ---
        title_element = item.find('title')
        item_data['Item'] = title_element.text if title_element is not None else ''

        # --- Categories ---
        categories_by_domain = {}
        for category in item.findall('category'):
            # **THE FIX IS HERE: Clean the domain name to remove the 'cpdr_' prefix**
            domain = category.get('domain', 'uncategorized').replace('cpdr_', '')
            value = category.text
            if domain not in categories_by_domain:
                categories_by_domain[domain] = []
            categories_by_domain[domain].append(value)
        
        # Join category values into a single string (e.g., "France, Germany")
        for domain, values in categories_by_domain.items():
             item_data[domain] = ', '.join(values) if values else ''

        # --- Metadata (for Years, Names, etc.) ---
        for meta in item.findall('wp:postmeta', namespaces):
            key_element = meta.find('wp:meta_key', namespaces)
            value_element = meta.find('wp:meta_value', namespaces)
            if key_element is not None and value_element is not None:
                # Also clean the meta key name for consistency
                clean_key = key_element.text.replace('cpdr_', '')
                item_data[clean_key] = value_element.text

        all_items_data.append(item_data)

    if not all_items_data:
        print("Warning: No published 'cpdr' items were found in the XML file.")
        return

    # Convert the list of dictionaries to a Pandas DataFrame
    df = pd.DataFrame(all_items_data)
    
    # --- Final Data Cleaning and Column Selection ---
    # Define the exact columns you want in your final CSV file
    final_columns = [
        'Item', 'respondent_nation', 'complainant_nation', 'case_status',
        'year_claim_initiated', 'year_claim_resolved', 'means_of_resolution',
        'respondent_type', 'complainant_type', 'respondent_nation_economy',
        'complainant_nation_economy', 'provenience_nation'
    ]
    
    # Create the final DataFrame, ensuring all desired columns exist
    final_df = pd.DataFrame()
    for col in final_columns:
        if col in df.columns:
            final_df[col] = df[col]
        else:
            final_df[col] = '' # Add a blank column if it was never found in any item

    # Save the final, clean DataFrame to a CSV
    try:
        final_df.to_csv(csv_path, index=False, encoding='utf-8')
        print(f"Success! Created '{csv_path}' with {len(final_df)} published cases.")
    except IOError as e:
        print(f"Error: Could not write to CSV file at {csv_path}. {e}")

# --- HOW TO RUN ---
if __name__ == '__main__':
    # Use your newest, most complete XML file as the input.
    xml_input_file = '/Users/landen/Documents/GitHub/cpdr/culturalpropertydisputesresource.WordPress.2025-07-14.xml'
    
    # Define a clear name for your new, clean output file.
    csv_output_file = 'cpdr_published_cases.csv'
    
    create_clean_csv_from_wordpress_export(xml_input_file, csv_output_file)