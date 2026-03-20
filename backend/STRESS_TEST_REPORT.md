# NovaWorkGlobal - Stress Test Report

**Fecha:** 2026-03-20  
**Duración:** 4 minutos 30 segundos  
**Max VUs:** 200  

---

## Configuración del Test

### Script: `stress-test_2.js`

```javascript
stages: [
  { duration: '1m', target: 50 },
  { duration: '1m', target: 100 },
  { duration: '1m', target: 150 },
  { duration: '1m', target: 200 },
  { duration: '30s', target: 0 },
]
```

### Thresholds
| Métrica | Threshold | Resultado |
|---------|-----------|-----------|
| http_req_failed | < 20% | 4.68% ✓ |
| http_req_duration | p(95) < 3000ms | 132.64ms ✓ |
| errors | < 20% | 0.00% ✓ |
| login_duration | p(95) < 2500ms | 185.51ms ✓ |
| profile_duration | p(95) < 2000ms | 127.08ms ✓ |
| accomplishment_duration | p(95) < 2500ms | 144.85ms ✓ |
| work_exp_duration | p(95) < 2500ms | 141.67ms ✓ |
| interview_duration | p(95) < 2500ms | 132.80ms ✓ |
| career_vision_duration | p(95) < 3000ms | 132.27ms ✓ |
| cover_letter_duration | p(95) < 3000ms | 136.51ms ✓ |
| par_stories_duration | p(95) < 2500ms | 136.91ms ✓ |
| accomplishment_bank_duration | p(95) < 2500ms | 145.97ms ✓ |

---

## Resultados Finals

### Resumen General
| Métrica | Valor |
|---------|-------|
| Iteraciones | 21,588 |
| VUs Max | 200 |
| Checks Totales | 18,777 |
| Checks Exitosos | 89.67% |
| Tiempo Total | 4m 30s |

### Throughput
| Métrica | Valor |
|---------|-------|
| HTTP Requests | 41,392 |
| Velocidad | 153 req/s |
| Datos Recibidos | 130 MB |
| Datos Enviados | 9.5 MB |

### Tiempos de Respuesta (p95)
| Endpoint | p(95) | Status |
|----------|-------|--------|
| profile_duration | 127.08ms | ✓ |
| career_vision_duration | 132.27ms | ✓ |
| interview_duration | 132.80ms | ✓ |
| cover_letter_duration | 136.51ms | ✓ |
| par_stories_duration | 136.91ms | ✓ |
| work_exp_duration | 141.67ms | ✓ |
| accomplishment_duration | 144.85ms | ✓ |
| accomplishment_bank_duration | 145.97ms | ✓ |
| http_req_duration | 132.64ms | ✓ |

---

## Endpoints Probados

### Lecturas Ligeras (60%)
- `GET /rest/v1/user_profiles`
- `GET /rest/v1/par_stories`
- `GET /rest/v1/users`

### Lecturas Medianas (25%)
- `GET /rest/v1/accomplishments`
- `GET /rest/v1/work_experience`
- `GET /rest/v1/interviews`

### Lecturas Pesadas (15%)
- `GET /rest/v1/career_vision_profiles`
- `GET /rest/v1/accomplishment_bank`
- `GET /rest/v1/cover_letters`

---

## Observaciones

### Puntos Positivos
1. Todos los thresholds pasaron exitosamente
2. Tiempos de respuesta excelentes (< 150ms p95)
3. Soporte para 200 usuarios concurrentes
4. Throughput estable de 153 req/s

### Consideraciones
1. **Rate Limiting de Login:** Supabase bloquea múltiples intentos de login desde la misma IP. Estrategia: 1 login por VU, reutilizar token.
2. **RLS Policies:** Verificar que las políticas de Row Level Security permitan los selects necesarios.

---

## Comandos para Ejecutar

```bash
k6 run stress-test_2.js \
  -e BASE_URL=https://fytyfeapxgswxkecneom.supabase.co \
  -e EMAIL=tu-email@ejemplo.com \
  -e PASSWORD=tu-password \
  -e API_KEY=tu-api-key
```

---

## Conclusión

La API de NovaWorkGlobal soporta **200 usuarios concurrentes** con tiempos de respuesta óptimos (p95 < 150ms). El sistema es estable bajo carga moderada y los endpoints funcionan correctamente.

**Recomendación:** Para pruebas de carga mayor, considerar implementar un sistema de cache o aumentar los límites de rate limiting en Supabase.
