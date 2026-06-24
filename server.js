const http = require('http');
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DIR  = __dirname;
const PORT = 3456;

const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];

    if (req.method === 'GET' && (url === '/' || url === '/editor.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(DIR, 'editor.html')).pipe(res);

    } else if (req.method === 'GET' && url === '/sentences.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.createReadStream(path.join(DIR, 'sentences.json')).pipe(res);

    } else if (req.method === 'POST' && url === '/save') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                JSON.parse(body); // validate JSON before writing
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid JSON: ' + e.message);
                return;
            }

            fs.writeFileSync(path.join(DIR, 'sentences.json'), body);

            exec(
                'git add sentences.json && git commit -m "Update sentence templates" && git push',
                { cwd: DIR },
                (err, stdout, stderr) => {
                    const out = stdout + stderr;
                    if (err && !out.toLowerCase().includes('nothing to commit')) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end(stderr || err.message);
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('ok');
                    }
                }
            );
        });

    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('Sentence editor running — opening browser...');
    exec(`start http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop.\n');
});
