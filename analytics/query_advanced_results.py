
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

def print_table(cur, title, query, headers):
    print(f"\n📊 {title}\n")
    try:
        cur.execute(query)
        rows = cur.fetchall()
        if not rows:
            print("No hay datos disponibles.")
            return

        t = PrettyTable(headers)
        for row in rows:
            t.add_row(list(row))
        print(t)
    except Exception as e:
        print(f"Error consultando {title}: {e}")

def main():
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # 1. Habilidades (Ya visto)
        # print_table(cur, "Top Habilidades", 
        #     "SELECT skill, total_users, popularity_percent FROM public_analytics.top_skills_report LIMIT 5",
        #     ['Habilidad', 'Usuarios', '%'])

        # 2. Intereses y Valores
        print_table(cur, "Top Intereses y Valores (Psicografía)", 
            "SELECT type, name, count FROM public_analytics.trends_interests_values LIMIT 10",
            ['Tipo', 'Nombre', 'Usuarios'])

        # 3. Demografía de Experiencia
        print_table(cur, "Nivel de Seniority (basado en CVs)", 
            "SELECT seniority_level, user_count, round(avg_roles, 1) FROM public_analytics.experience_demographics",
            ['Nivel', 'Usuarios', 'Prom. Roles'])

        # 4. Funnel de Entrevistas
        print_table(cur, "Embudo de Entrevistas", 
            "SELECT status, total_interviews, active_users FROM public_analytics.engagement_interview_funnel",
            ['Estado', 'Entrevistas', 'Usuarios Activos'])
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error general: {e}")

if __name__ == "__main__":
    main()
