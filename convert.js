const { Worker } = require('worker_threads');
const os = require('os');
const fs = require('fs');
const path = require('path');

const targetDirectory = './kanjiSVG';
const numCPUs = os.cpus().length;

fs.readdir(targetDirectory, (err, files) => {
    if (err) {
        console.error(`Error reading directory: ${err}`);
        return;
    }

    const svgFiles = files.filter(file => path.extname(file) === '.svg');
    const totalFiles = svgFiles.length;
    const filesPerThread = Math.ceil(totalFiles / numCPUs);

    let completedThreads = 0;

    for (let i = 0; i < numCPUs; i++) {
        const worker = new Worker('./convertWorker.js');
        const startIndex = filesPerThread * i;
        const endIndex = Math.min(startIndex + filesPerThread, totalFiles);
        const fileSubset = svgFiles.slice(startIndex, endIndex);

        worker.postMessage({ targetDirectory, fileSubset });

        worker.on('message', message => {
            console.log(message);
        });

        worker.on('error', error => {
            console.error('Worker error:', error);
        });

        worker.on('exit', code => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            } else {
                completedThreads++;
                if (completedThreads === numCPUs) {
                    console.log('All workers completed successfully.');
                }
            }
        });
    }
});