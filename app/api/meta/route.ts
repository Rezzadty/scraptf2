import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(): Promise<Response> {
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'meta.json'), 'utf-8');
    return Response.json(JSON.parse(raw));
  } catch {
    return Response.json(null);
  }
}
