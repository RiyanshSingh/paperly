import sys
import fitz  # PyMuPDF
import os
import traceback

input_file = sys.argv[1]
output_file = sys.argv[2]
fmt = sys.argv[3].lower()

try:
    if fmt in ["jpg", "jpeg", "png", "webp", "heic", "picture", "image"]:
        # Convert Image to PDF using PyMuPDF
        import io
        from PIL import Image

        # If it's WEBP or HEIC or an unsupported image type, use PIL to convert to JPEG/PNG bytes first
        try:
            img = Image.open(input_file)
            if img.mode != "RGB":
                img = img.convert("RGB")
            
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG')
            img_bytes = img_byte_arr.getvalue()
        except Exception as e:
            # Fallback if Pillow fails, read raw bytes (works for jpg/png)
            with open(input_file, "rb") as f:
                img_bytes = f.read()

        doc = fitz.open()
        imgdoc = fitz.open("jpeg", img_bytes)
        pdfbytes = imgdoc.convert_to_pdf()
        imgdoc.close()
        
        pdf = fitz.open("pdf", pdfbytes)
        doc.insert_pdf(pdf)
        doc.save(output_file)
        doc.close()

    else:
        # For Word, Excel, PPTX, HTML, TXT, EPUB -> we use LibreOffice via shell command instead of python.
        # But if this python script is called for them, just print a flag for node.js to handle it.
        print("USE_LIBREOFFICE")
        sys.exit(0)

    print("SUCCESS")
except Exception as e:
    print("ERROR:", str(e))
    traceback.print_exc()
    sys.exit(1)
