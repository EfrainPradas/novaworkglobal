
import os
import psycopg2
from prettytable import PrettyTable

def get_connection():
    return psycopg2.connect(
        host="aws-0-us-west-2.pooler.supabase.com",
        database="postgres",
        user="postgres.fytyfeapxgswxkecneom",
        password=os.environ.get("DB_PASSWORD"),
        port=6543
    )

def main():
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        print("\n📊 Top 20 Habilidades (Generado por dbt)\n")
        
        cur.execute("SELECT skill, total_users, popularity_percent FROM public_analytics.top_skills_report ORDER BY total_users DESC")
        rows = cur.fetchall()
        
        t = PrettyTable(['Habilidad', 'Usuarios', '% Popularidad'])
        for row in rows:
            t.add_row([row[0].title(), row[1], f"{row[2]}%"])
            
        print(t)
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
