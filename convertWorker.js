const { parentPort } = require('worker_threads');
const { createConverter } = require('convert-svg-to-png');
const fs = require('fs');
const path = require('path');

parentPort.on('message', async ({ targetDirectory, fileSubset }) => {
    const converter = createConverter();

    try {
        for (const file of fileSubset) {
            const filePath = path.join(targetDirectory, file);
            
            // Read the SVG content
            const svgContent = fs.readFileSync(filePath, 'utf8');

            // Make the specified replacements
            const updatedSvgContent = svgContent
                .replace(/fill:none;stroke:#000000/g, 'fill:none;stroke:#5765F2')
                .replace(/font-size:8;fill:#808080/g, 'font-size:8;fill:#FFFFFF');

            // Write the updated content back to the file
            fs.writeFileSync(filePath, updatedSvgContent, 'utf8');

            // Convert the updated SVG to a PNG
            const pngFilePath = await converter.convertFile(filePath, { height: 400, width: 400, outputFilePath: `./kanjiPNG/${file.replace("svg", "png")}` });
            parentPort.postMessage(`Converted ${filePath} to ${pngFilePath}`);
        }
    } catch (error) {
        console.error('Error in worker:', error);
    } finally {
        await converter.destroy();
        parentPort.close();
    }
});