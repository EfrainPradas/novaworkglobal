
import urllib.request
import json
import ssl

try:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    url = "https://dns.google/resolve?name=db.fytyfeapxgswxkecneom.supabase.co"
    with urllib.request.urlopen(url, context=ctx) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print(e)
