---
tags: [adr, decision, ui, material-design, desktop]
status: Aceptado
date: 2026-09-13
---

# ADR-012 Rediseño UI con Material Design 3

## Status

Aceptado — implementado (2026-09-13). Supersede el ítem de estética visual de
[[ADR-004 Base de escritorio TodoDex a SisyFlow]] y de
[[Paridad funcional con TodoDex]] (sección Look & feel).

## Contexto

Las fases 0–5 completaron toda la funcionalidad de SisyFlow: jerarquía
Épica > Proyecto > Tarea, nube-first con UI optimista, gamificación (rachas y
heatmap) y migración Sísifo. Sin embargo, la UI es la heredada de TodoDex:

- Estética pastel "Nintendo OS" pensada para una app offline de tareas; las
  funcionalidades nuevas (rachas, heatmap, vista del día) no tienen patrones
  visuales propios.
- Sin shell de navegación: Home concentra el acceso a todo (Épicas, Progreso,
  Ajustes, backup, logout) con botones-ícono; las subpantallas usan "volver".
- El progreso (lo que motiva el método Seinfeld) vive en una pantalla oculta
  detrás de un ícono.
- Sin dark mode ni sistema de tokens: colores hardcodeados en Tailwind, hex
  inline desde la BD, sin CSS variables.
- Sin librería ni patrón de animación: transiciones sueltas de Tailwind; los
  diálogos declaran clases `animate-in` sin plugin que las genere.
- Inconsistencias menores: clases muertas, microcopy sin tildes, tamaños de
  texto de 9–10 px por debajo del mínimo accesible.

Decisiones de producto tomadas con el usuario (2026-09-13):

- Adoptar **Material Design 3** con esquema baseline (violeta `#6750A4`),
  descartando la identidad pastel como decisión explícita.
- **Light + dark** con toggle persistido.
- Tipografía **M PLUS Rounded 1c** mapeada a la escala tipográfica MD3.
- Iconos **Material Symbols Rounded** (auto-hospedados, variante filled en
  estados activos).
- Exponer las capacidades sin UI del inventario de paridad: **búsqueda** de
  tareas y **tags por proyecto**.
- **Inicio progress-first**: el progreso es lo primero que se ve; la pantalla
  `/progress` desaparece y su contenido se integra a Inicio.

Alternativas consideradas:

1. Refresco incremental manteniendo la estética pastel. Descartada por decisión
   de producto: el rediseño es total.
2. Adoptar una librería de componentes (MUI, Mantine). Descartadas: Mantine ya
   entra solo por BlockNote y no se monta; MUI no implementa MD3 completo sin
   paquetes experimentales. El proyecto ya tiene un UI kit propio sobre Radix,
   lo que abarata implementar los tokens MD3 a mano.
3. Ripple web nativo: MD3 en web se apoya en state layers; se implementa ripple
   liviano en componentes de acción (FAB, botones, icon buttons).

## Decisión

Se rediseña la UI/UX completa de `apps/desktop` con Material Design 3:

1. **Tokens MD3 en CSS variables + Tailwind**
   - Roles de color completos (`primary`, `on-primary`,
     `primary-container`, `surface-container-*`, `outline`, `error`,
     `inverse-*`, etc.) en light y dark bajo `:root` y `.dark`.
   - `darkMode: 'class'` en Tailwind; colores leyendo
     `rgb(var(--md-*) / <alpha-value>)`.
   - Escala tipográfica MD3 (display/headline/title/body/label × L/M/S) con
     M PLUS Rounded 1c.
   - Escala de forma MD3 (xs 4, sm 8, md 12, lg 16, xl 28, full).
   - Elevaciones 0–5 (ambient + key shadows) y motion tokens: duraciones
     50–600 ms y easings standard/emphasized (+ decelerate/accelerate).
   - State layers (hover 8 %, focus 10 %, pressed 10 %, dragged 16 %) y
     utilidades de ripple/shimmer.
2. **Tema**: `ThemeProvider` con preferencia persistida en
   `localStorage` (`sisyflow.theme`), default `prefers-color-scheme`; toggle en
   top app bar y Ajustes.
3. **Iconografía**: `material-symbols` (Rounded) auto-hospedado; componente
   `Icon` con ejes `FILL`/`wght`/`opsz`; iconos filled para destinos activos.
   Se retira `lucide-react`.
4. **Shell de navegación**: `NavigationRail` (Inicio, Épicas, Ajustes) +
   `TopAppBar` contextual (título, búsqueda, tema, menú de cuenta) + FAB
   contextual + snackbar MD3. Transiciones entre rutas "shared axis"
   (`motion`), container transform para overlays y fade through para cambios
   de vista. `prefers-reduced-motion` respetado.
5. **Inicio progress-first** (orden fijo):
   1. Hero de racha (global; sigue el filtro del heatmap) con mejor marca.
   2. Heatmap compacto (~18 semanas) con filtro global/por épica y expansión
      in-place al año completo.
   3. Chips horizontales de racha por épica (preserva la comparación de
      `/progress`).
   4. Tareas del día.
   5. Proyectos agrupados por épica.
   - Se elimina la ruta `/progress` y su destino del rail; se elimina el toggle
     Proyectos / Tareas del día (secciones apiladas).
6. **Nuevo RPC `streak_global(p_tz, p_today)`** con las mismas reglas de
   weekend freeze que `epic_streaks` ([[ADR-011 Gamificacion zona horaria rachas y heatmap]]),
   `security invoker`, execute solo `authenticated` y tests pgTAP.
7. **Superficies nuevas**:
   - Búsqueda global en top app bar sobre `useSearchTodos` (navega al proyecto
     y abre la tarea).
   - Tags por proyecto en la pantalla de proyecto sobre `useProjectTags` (CRUD
     con chips MD3); sin cambios de esquema (los tags son por proyecto).
8. **Datos intactos**: `color_code` hex almacenados siguen siendo válidos; el
   selector pasa a una paleta de acentos Material y la UI deriva tonos para
   contenedores. Backup v2/v3, migración Sísifo y RLS no cambian.

## Consecuencias

### Positivas

- Un sistema de diseño único y consistente (tokens, tipografía, forma,
  elevación, movimiento) aplicable a features futuras.
- El progreso queda visible al abrir la app; la gamificación pasa a ser el
  centro del producto, alineado al método Seinfeld.
- Dark mode completo y accesibilidad mejorada (escala tipográfica, contraste,
  focus visible, reduced motion).
- Navegación escalable: el rail permite sumar destinos sin sobrecargar Home.
- Búsqueda y tags dejan de ser capacidades muertas del inventario de paridad.

### Negativas / Trade-offs

- Se abandona la identidad pastel "Nintendo OS"; el ícono de la app
  (`assets/icon.svg`) conserva la paleta pastel, lo que puede requerir
  re-evaluación visual del ícono más adelante.
- Más dependencias: `motion`, `material-symbols` y Radix adicional; el bundle
  crece (~2–3 MB por la fuente de iconos, aceptable en Electron).
- El theming de BlockNote/Mantine es parcial: se resuelve por CSS variables y
  requiere verificación visual en dark.
- El rediseño toca prácticamente todo `src/components/`; la regresión
  funcional se mitiga con etapas verificables y el checklist de paridad.

### Neutrales

- El modelo de datos, RLS, backup, migración y hooks no cambian de contrato
  (solo se agrega el RPC de racha global).
- Los hex pastel existentes en la BD se conservan; la paleta de selección
  cambia solo para valores nuevos.
- `lucide-react` se retira del proyecto.

## Relaciones

- **MOC:** [[00 Inbox/MOC]]
- **Supersede:** ítem "estética pastel" de [[ADR-004 Base de escritorio TodoDex a SisyFlow]] y [[Paridad funcional con TodoDex]]
- **Relacionada con:** [[ADR-001 Eleccion de stack]], [[ADR-007 Jerarquia Epicas Proyectos Tareas]], [[ADR-008 Estrategia de datos nube-first]], [[ADR-011 Gamificacion zona horaria rachas y heatmap]]
- **Afecta a:** [[App de escritorio (base TodoDex)]], [[Paridad funcional con TodoDex]], [[Capa de datos Supabase]], [[Gamificacion]], [[Editor de contenido (BlockNote)]], [[Builds de escritorio (Windows)]]
- **Repo:** `apps/desktop/`
