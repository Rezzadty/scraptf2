import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const { game, item, quality, spell, wear, itemClass } = body;

    const args = ['scripts/scrape.py'];
    if (game) args.push('--game', String(game));
    if (item) args.push('--item', String(item));
    if (quality) args.push('--quality', quality);
    if (spell) args.push('--spell', spell);
    if (wear) args.push('--wear', wear);
    if (itemClass) args.push('--item-class', itemClass);

    return new Promise<Response>((resolve) => {
      const pythonProcess = spawn('python', args);

      let stderrData = '';
      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Add cache-busting timestamp
          const timestamp = Date.now();
          
          Promise.all([
            readFile(join(process.cwd(), 'data', 'items.json'), 'utf-8'),
            readFile(join(process.cwd(), 'data', 'meta.json'), 'utf-8')
          ]).then(([items, meta]) => {
            resolve(
              Response.json({
                items: JSON.parse(items),
                meta: JSON.parse(meta),
                _cacheBust: timestamp
              })
            );
          }).catch((err) => {
            console.error('Failed to read data files:', err);
            resolve(Response.json({ error: 'Failed to read scraped data' }, { status: 500 }));
          });
        } else {
          console.error(`Python process exited with code ${code}`);
          if (stderrData) {
            console.error(`Python stderr: ${stderrData}`);
          }
          resolve(Response.json({ error: `Scrape failed with code ${code}` }, { status: 500 }));
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        resolve(Response.json({ error: 'Failed to start Python process' }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
