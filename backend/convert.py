import sys
import fitz  # PyMuPDF
import zipfile
import os
import traceback

input_pdf = sys.argv[1]
output_file = sys.argv[2]
fmt = sys.argv[3].lower()

try:
    if fmt in ["docx"]:
        from pdf2docx import Converter
        cv = Converter(input_pdf)
        cv.convert(output_file, start=0, end=None)
        cv.close()

    elif fmt in ["xlsx"]:
        import pdfplumber
        import pandas as pd
        with pdfplumber.open(input_pdf) as pdf:
            writer = pd.ExcelWriter(output_file, engine='openpyxl')
            table_found = False
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                if tables:
                    for j, table in enumerate(tables):
                        # Convert to DataFrame and drop purely None/Empty rows if needed
                        df = pd.DataFrame(table[1:], columns=table[0]) if len(table) > 1 else pd.DataFrame(table)
                        # Remove illegal characters for Excel sheet names and keep length <= 31
                        sheet_name = f'P{i+1}_T{j+1}'[:31]
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                        table_found = True
            
            if not table_found:
                pd.DataFrame(['No tables were found in the PDF.']).to_excel(writer, sheet_name='Sheet1', index=False)
            writer.close()

    elif fmt in ["pptx"]:
        from pptx import Presentation
        from pptx.util import Inches
        prs = Presentation()
        # Set slide size to A4 roughly or match PDF, but standard 4:3 is 10x7.5 inches. 
        # We'll just use the default and fit the image.
        doc = fitz.open(input_pdf)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=200)
            img_path = f"/tmp/slide_img_{page_num}.png"
            pix.save(img_path)
            
            # Add blank slide
            blank_slide_layout = prs.slide_layouts[6]
            slide = prs.slides.add_slide(blank_slide_layout)
            
            # Add image to fit slide (approximate stretching/fitting)
            slide.shapes.add_picture(img_path, 0, 0, width=prs.slide_width, height=prs.slide_height)
            os.remove(img_path)
            
        prs.save(output_file)

    elif fmt in ["jpg", "png", "webp"]:
        import io
        from PIL import Image
        doc = fitz.open(input_pdf)
        with zipfile.ZipFile(output_file, 'w') as zf:
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(dpi=300)
                img_path = f"page_{page_num+1}.{fmt}"
                if fmt == "webp":
                    # PyMuPDF doesn't natively support webp bytes output, so use Pillow
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    img_byte_arr = io.BytesIO()
                    img.save(img_byte_arr, format='WEBP')
                    img_bytes = img_byte_arr.getvalue()
                else:
                    img_bytes = pix.tobytes(fmt)
                zf.writestr(img_path, img_bytes)

    elif fmt in ["txt", "html"]:
        doc = fitz.open(input_pdf)
        with open(output_file, "w", encoding="utf-8") as f:
            for page in doc:
                extract_fmt = "text" if fmt == "txt" else fmt
                f.write(page.get_text(extract_fmt))

    elif fmt in ["epub"]:
        # Fallback: Extract text as HTML and save.
        doc = fitz.open(input_pdf)
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("<html><body>")
            for page in doc:
                f.write(page.get_text("html"))
            f.write("</body></html>")

    print("SUCCESS")
except Exception as e:
    print("ERROR:", str(e))
    traceback.print_exc()
    sys.exit(1)
