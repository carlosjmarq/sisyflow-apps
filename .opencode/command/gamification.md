---
description: Fase 5 — gamificación: daily_epic_logs, heatmap, rachas y weekend freeze (US 3.1–3.4)
agent: build
---

Fase 5 del proyecto con ciclo RPI. Alcance: US 3.1–3.4.

1. **Research.** Lee `docs/20 Tecnico/Gamificacion.md` y las US 3.1–3.4. Carga `supabase`, `supabase-postgres-best-practices` y `vercel-react-best-practices`.
2. **Plan.** Decide y documenta: zona horaria de corte del día, cálculo en SQL vs. cliente, best streak (cálculo vs. persistencia) y enfoque del heatmap (librería vs. componente propio). Si es decisión de arquitectura, crea `/adr`.
3. **Implement.**
   - **US 3.1:** vista `daily_epic_logs` `[fecha, epic_id, cantidad_completada]` con índices eficientes.
   - **US 3.2:** heatmap de 365 días estilo GitHub con selector Global / por Épica, intensidad por cantidad y color de la Épica.
   - **US 3.3:** racha actual y mejor marca por Épica con las reglas de corte (si hoy no hay nada y ayer sí, se mantiene; si ayer cerró en 0, cae a 0).
   - **US 3.4:** weekend freeze (sáb/dom en 0 no rompen; completar en finde suma +1).
4. **Verificación.** Casos de prueba con datos sembrados: racha mantenida, rota, congelada por finde y sumada por finde. Paridad intacta.
5. **Cierre.** Actualiza `Gamificacion`, notas afectadas y MOC. Commit atómico.
