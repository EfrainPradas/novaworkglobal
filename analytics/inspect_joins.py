
import os
import psycopg2

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
        
        tables = ['job_applications', 'user_resumes']
        
        for table in tables:
            print(f"\n🔍 Columnas de '{table}':\n")
            cur.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table}' 
                ORDER BY ordinal_position;
            """)
            rows = cur.fetchall()
            for row in rows:
                print(f"- {row[0]}")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
