
import urllib.request
import json
import ssl

try:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    url = "https://dns.google/resolve?name=db.fytyfeapxgswxkecneom.supabase.co&type=A"
    with urllib.request.urlopen(url, context=ctx) as response:
        data = json.loads(response.read())
        if 'Answer' in data:
            print(data['Answer'][0]['data'])
        else:
            print("No Answer")
except Exception as e:
    print(e)
