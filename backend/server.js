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

    res.download(outputPath, 'unlocked.pdf', (err) => {
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
      
      exec(cmd, (error, stdout, stderr) => {
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

    res.download(outputPath, 'compressed.pdf', (err) => {
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Paperly Backend API is running on http://localhost:${PORT}`);
});
