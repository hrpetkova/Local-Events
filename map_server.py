
import http.server
import socketserver
import webbrowser

PORT = 8766

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🚀 Serving at http://localhost:{PORT}/index.html")
    webbrowser.open(f"http://localhost:{PORT}/index.html")
    httpd.serve_forever()
