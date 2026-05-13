import pandas as pd
import os
import re

def sanitize(text):
    return re.sub(r'[^\w\s-]', '', str(text)).strip().replace(' ', '_').lower()[:30]

def segment_file(file_path, output_dir):
    xl = pd.ExcelFile(file_path)
    for sheet_name in xl.sheet_names:
        print(f"Processing sheet: {sheet_name}")
        df = xl.parse(sheet_name, header=None)
        
        block_start = 0
        block_id = 0
        
        for i, row in df.iterrows():
            # Check if row is empty
            if row.isnull().all():
                if i > block_start:
                    save_block(df, block_start, i, sheet_name, block_id, output_dir)
                    block_id += 1
                block_start = i + 1
        
        # Save last block
        if len(df) > block_start:
            save_block(df, block_start, len(df), sheet_name, block_id, output_dir)

def save_block(df, start, end, sheet_name, block_id, output_dir):
    block = df.iloc[start:end].dropna(how='all', axis=0).dropna(how='all', axis=1)
    if not block.empty:
        # Try to find a title in the first row
        potential_title = sanitize(block.iloc[0, 0]) if not pd.isnull(block.iloc[0,0]) else f"block_{block_id}"
        filename = f"{sanitize(sheet_name)}_{potential_title}.csv"
        path = os.path.join(output_dir, filename)
        block.to_csv(path, index=False, header=False)
        print(f"  Saved: {filename}")

segment_file('/home/jp/proyectos/CotizadorLodge/Data/Precios empresas actualizado año  2025.xlsx', 'processed_data/2025/raw')
segment_file('/home/jp/proyectos/CotizadorLodge/Data/Precios empresas actualizado mayo 2026.xlsx', 'processed_data/2026/raw')
