import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.env.PORT||5173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const decoded=decodeURIComponent(url.pathname);
    const target=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
    if(!target.startsWith(root)){res.writeHead(403);res.end('Forbidden');return;}
    const contents=await readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(contents);
  } catch {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('No encontrado');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Sushi Bites · http://127.0.0.1:${port}`));
