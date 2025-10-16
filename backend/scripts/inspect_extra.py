import json
import sys
from sqlalchemy import create_engine, text

url = "postgresql://postgres:Kasthuri%401971@127.0.0.1:5432/postgres"
engine = create_engine(url)

# Accept content id via first arg
content_id = int(sys.argv[1]) if len(sys.argv) > 1 else 11

with engine.connect() as conn:
    row = conn.execute(
        text(f"select id, extra_data from contents where id={content_id};")
    )
    r = row.fetchone()
    print(r)
    if r and r[1]:
        print(json.dumps(r[1], indent=2))
