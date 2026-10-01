const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: 'uploads/' });

// UNLOCK ENDPOINT
app.post('/api/unlock', upload.single('pdf'), (req, res) => {
  const file = req.file;
  const password = req.body.password;

  if (!file || !password) {
    return res.status(400).json({ error: 'File and password are required' });
  }

  const inputPath = file.path;
  const outputPath = path.join('uploads', `unlocked_${file.filename}.pdf`);

  const escapedPassword = password.replace(/(["\s'$`\\])/g, '\\$1');
  const cmd = `qpdf --decrypt --password=${escapedPassword} "${inputPath}" "${outputPath}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('qpdf error:', stderr || error.message);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      return res.status(400).json({ error: 'Failed to unlock PDF. Incorrect password.' });
    }

    res.download(outputPath, 'unlocked.pdf', () => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  });
});

// COMPRESS ENDPOINT
app.post('/api/compress', upload.single('pdf'), async (req, res) => {
  const file = req.file;
  const compressionLevel = req.body.level || 'high';
  const targetSizeMB = parseFloat(req.body.targetSize);

  if (!file) {
    return res.status(400).json({ error: 'File is required' });
  }

  const inputPath = file.path;
  const outputPath = path.join('uploads', `compressed_${file.filename}.pdf`);

  const runGhostscript = (dpi) => {
    return new Promise((resolve, reject) => {
      const tempOutput = path.join('uploads', `temp_${Date.now()}_${file.filename}.pdf`);
      // Use specific DPI for downsampling
      const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dDownsampleColorImages=true -dColorImageResolution=${dpi} -dDownsampleGrayImages=true -dGrayImageResolution=${dpi} -dDownsampleMonoImages=true -dMonoImageResolution=${dpi} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tempOutput}" "${inputPath}"`;
      
      exec(cmd, (error) => {
        if (error) {
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
          reject(error);
        } else {
          resolve(tempOutput);
        }
      });
    });
  };

  try {
    if (targetSizeMB && targetSizeMB > 0) {
      const targetBytes = targetSizeMB * 1024 * 1024;
      const dpisToTry = [150, 100, 72, 36];
      let finalFile = null;

      for (const dpi of dpisToTry) {
        const tempOutput = await runGhostscript(dpi);
        const stats = fs.statSync(tempOutput);
        
        if (finalFile && fs.existsSync(finalFile)) {
            fs.unlinkSync(finalFile); // delete previous attempt
        }
        finalFile = tempOutput;

        // If we hit the target size or below, break out of loop
        if (stats.size <= targetBytes) {
          break;
        }
      }
      
      fs.renameSync(finalFile, outputPath);
    } else {
      // Standard Mapping
      let pdfSettings = '/ebook'; 
      if (compressionLevel === 'extreme') pdfSettings = '/screen'; 
      if (compressionLevel === 'high') pdfSettings = '/ebook'; 
      if (compressionLevel === 'recommended') pdfSettings = '/printer'; 
      if (compressionLevel === 'minimum') pdfSettings = '/prepress'; 

      const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${pdfSettings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
      
      await new Promise((resolve, reject) => {
        exec(cmd, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    res.download(outputPath, 'compressed.pdf', () => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });

  } catch (error) {
    console.error('Ghostscript error:', error);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    return res.status(500).json({ error: 'Failed to compress PDF.' });
  }
});
// UNIVERSAL CONVERT ENDPOINT
app.post('/api/convert', upload.single('pdf'), async (req, res) => {
  const file = req.file;
  const format = req.body.format;

  if (!file || !format) {
    return res.status(400).json({ error: 'File and format are required' });
  }

  const inputPath = file.path;
  const safeFormat = format.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Set appropriate extension
  let ext = safeFormat;
  if (['jpg', 'png', 'webp'].includes(safeFormat)) {
      ext = 'zip'; // Image extracts will be zipped
  }
  
  const outputPath = path.join('uploads', `converted_${file.filename}.${ext}`);
  const pythonPath = path.join(__dirname, 'venv', 'bin', 'python');
  const scriptPath = path.join(__dirname, 'convert.py');

  const cmd = `"${pythonPath}" "${scriptPath}" "${inputPath}" "${outputPath}" "${safeFormat}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Python conversion error:', stderr || error.message);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      return res.status(500).json({ error: 'Failed to convert PDF.' });
    }

    res.download(outputPath, `converted.${ext}`, () => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  });
});
// UNIVERSAL CONVERT TO PDF ENDPOINT
app.post('/api/convert-to-pdf', upload.single('file'), async (req, res) => {
  const file = req.file;
  const format = req.body.format;

  if (!file || !format) {
    return res.status(400).json({ error: 'File and format are required' });
  }

  const inputPath = file.path;
  const safeFormat = format.toLowerCase().replace(/[^a-z0-9]/g, '');
  const outputPath = path.join('uploads', `converted_${file.filename}.pdf`);
  
  // Try Python first (for images)
  const pythonPath = path.join(__dirname, 'venv', 'bin', 'python');
  const scriptPath = path.join(__dirname, 'convert_to_pdf.py');

  exec(`"${pythonPath}" "${scriptPath}" "${inputPath}" "${outputPath}" "${safeFormat}"`, (error, stdout, stderr) => {
    if (stdout && stdout.includes("USE_LIBREOFFICE")) {
      // Use LibreOffice for Word, Excel, PPT, etc.
      // Rename input file so LibreOffice knows the extension
      const loInputPath = inputPath + '.' + safeFormat;
      fs.renameSync(inputPath, loInputPath);
      
      const loCmd = `/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to pdf --outdir "${path.join(__dirname, 'uploads')}" "${loInputPath}"`;
      
      exec(loCmd, (loError, loStdout, loStderr) => {
        const loExpectedOutput = path.join('uploads', path.basename(loInputPath).replace('.' + safeFormat, '.pdf'));
        
        if (loError || !fs.existsSync(loExpectedOutput)) {
          console.error('LibreOffice error:', loStderr || loError?.message);
          if (fs.existsSync(loInputPath)) fs.unlinkSync(loInputPath);
          return res.status(500).json({ error: 'Failed to convert file to PDF using LibreOffice.' });
        }

        res.download(loExpectedOutput, 'converted.pdf', () => {
          if (fs.existsSync(loInputPath)) fs.unlinkSync(loInputPath);
          if (fs.existsSync(loExpectedOutput)) fs.unlinkSync(loExpectedOutput);
        });
      });
    } else if (error) {
      console.error('Python image conversion error:', stderr || error.message);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return res.status(500).json({ error: 'Failed to convert image to PDF.' });
    } else {
      // Success from python
      res.download(outputPath, 'converted.pdf', () => {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Paperly Backend API is running on http://localhost:${PORT}`);
});
