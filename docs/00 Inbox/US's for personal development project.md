# Documentación de Producto: SisyFlow (Electron + Supabase)

**Filosofía:** "El acto mismo de empujar la roca hacia la cima basta para llenar el corazón del hombre." El objetivo principal es mantener viva la cadena diaria de progreso (Streak) organizada por áreas de vida (Épicas).

  

## Módulo 1: Infraestructura y Migración Cloud

_El objetivo de este módulo es abandonar IndexedDB y establecer la base de datos relacional en la nube._

  

**US 1.1: Configuración de Cliente Supabase y Autenticación**

  

- **Como** usuario, **quiero** que la aplicación Electron se conecte a un proyecto de Supabase mediante autenticación segura **para** sincronizar mis datos en PostgreSQL.
    
      
    
- **Detalles Técnicos:** Al ser una app personal de escritorio, se puede usar autenticación por Email/Contraseña estándar.
    
      
    
- **Criterios de Aceptación:**
    
      
    - El SDK de Supabase (`@supabase/supabase-js`) está integrado e inicializado.
        
          
        
    - Existe una pantalla de Login/Registro funcional.
        
          
        
    - La sesión persiste localmente en Electron para no pedir login cada vez que se abre la app.
        
          
        
    - Se configuran políticas RLS (Row Level Security) en Supabase asegurando que el usuario solo puede leer/escribir `auth.uid() = user_id`.
        
          
        

**US 1.2: Script de Migración Sísifo (IndexedDB a Supabase)**

  

- **Como** usuario, **quiero** ejecutar un proceso de migración de una sola vez **para** volcar mis tareas locales existentes a la nueva base de datos sin perder el historial.
    
      
    
- **Criterios de Aceptación:**
    
      
    - La UI incluye un botón de "Migrar datos locales" en una sección de _Settings_.
        
          
        
    - El script lee todos los registros de IndexedDB, los formatea al nuevo esquema relacional y hace un _upsert_ masivo (batch insert) en Supabase.
        
          
        
    - Se muestra un estado de carga (loader) y una notificación de éxito o fallo al finalizar.
        
          
        

**US 1.3: Refactorización de Capa de Datos (Optimistic UI)**

  

- **Como** usuario, **quiero** que la interacción con mis tareas se sienta instantánea aunque ahora se guarden en la nube **para** no perder la fluidez de la app local.
    
      
    
- **Criterios de Aceptación:**
    
      
    - Todos los métodos CRUD locales se reemplazan por el cliente de Supabase.
        
          
        
    - El frontend implementa _Optimistic Updates_ (las tareas se tachan en la UI inmediatamente, antes de recibir el código 200 de Supabase). Si la red falla, la UI revierte el estado y muestra un error.
        
          
        

## Módulo 2: Jerarquía Estructural (Épicas > Proyectos > Tareas)

_El corazón organizativo de SisyFlow. Define cómo se agrupa el trabajo._

  

**US 2.1: Gestión de Épicas (Las Montañas de Sísifo)**

  

- **Como** usuario, **quiero** crear y gestionar Épicas (ej. "Carrera Profesional", "Salud", "Inglés") **para** definir las grandes áreas continuas de mi vida.
    
      
    
- **Detalles Técnicos (Esquema):** Tabla `epics` -> `id` (uuid), `user_id`, `name` (text), `color_code` (hex), `created_at` (timestamp).
    
      
    
- **Criterios de Aceptación:**
    
      
    - Existe un CRUD completo para las Épicas.
        
          
        
    - Se puede elegir un color hexadecimal para cada Épica (este color se usará para teñir el Heatmap posteriormente).
        
          
        
    - No existe botón de "completar" para las Épicas, ya que representan áreas de vida continuas.
        
          
        

**US 2.2: Ciclo de Vida de Proyectos (Las Rocas)**

  

- **Como** usuario, **quiero** crear proyectos finitos asignados a una Épica y gestionar su estado **para** agrupar tareas específicas que eventualmente terminarán.
    
      
    
- **Detalles Técnicos (Esquema):** Tabla `projects` -> `id` (uuid), `epic_id` (fk), `user_id`, `name` (text), `status` (enum: 'active', 'paused', 'completed'), `created_at`.
    
      
    
- **Criterios de Aceptación:**
    
      
    - Un proyecto debe pertenecer obligatoriamente a una Épica.
        
          
        
    - La vista principal de SisyFlow permite agrupar las tareas por proyecto activo.
        
          
        
    - Pausar o Completar un proyecto oculta sus tareas incompletas de la vista del día a día, pero mantiene intactos los registros históricos para no alterar el _Streak_.
        
          
        

**US 2.3: Gestión de Tareas (Los Empujes Diarios)**

  

- **Como** usuario, **quiero** crear tareas dentro de un proyecto específico **para** ejecutar acciones concretas.
    
      
    
- **Detalles Técnicos (Esquema):** Tabla `todos` -> `id`, `project_id` (fk), `user_id`, `title` (text), `is_completed` (boolean), `completed_at` (timestamp, nullable), `created_at`.
    
      
    
- **Criterios de Aceptación:**
    
      
    - La creación de un ToDo requiere seleccionar un proyecto padre.
        
          
        
    - Visualmente, el ToDo muestra un indicador (un punto, borde o etiqueta) con el color de la Épica a la que pertenece su proyecto.
        
          
        
    - Al marcar `is_completed` como `true`, el sistema registra automáticamente el `completed_at` con la fecha y hora exacta.
        
          
        

## Módulo 3: Gamificación "Seinfeld"

_La visualización del esfuerzo para no romper la cadena._

  

**US 3.1: Motor de Registro Diario (Daily Logs View)**

  

- **Como** sistema, **quiero** calcular cuántas tareas se completaron cada día agrupadas por Épica **para** alimentar los gráficos de rachas sin lógica compleja en el cliente.
    
      
    
- **Detalles Técnicos:** Se debe crear una **Vista SQL (View)** en Supabase llamada `daily_epic_logs` que extraiga la fecha de `completed_at`, haga un _JOIN_ con `projects` y agrupe contando las tareas por `epic_id` y por día.
    
      
    
- **Criterios de Aceptación:**
    
      
    - Consultar la vista debe devolver una lista limpia: `[fecha, epic_id, cantidad_completada]`.
        
          
        
    - Debe ser altamente eficiente, idealmente usando índices en `completed_at`.
        
          
        

**US 3.2: Mapa de Calor SisyFlow (Heatmap)**

  

- **Como** usuario, **quiero** ver un mapa de cuadros de los últimos 365 días **para** visualizar visualmente mi consistencia.
    
      
    
- **Criterios de Aceptación:**
    
      
    - La UI renderiza un gráfico estilo contribuciones de GitHub.
        
          
        
    - Posee un selector (Dropdown o Tabs) para filtrar: "Vista Global" o por "Épica Específica".
        
          
        
    - La intensidad del color del cuadro depende de la cantidad de tareas completadas ese día.
        
          
        
    - Si se filtra por una Épica, los cuadros usan el `color_code` de esa Épica (ej. variaciones de verde para "Salud", variaciones de azul para "Inglés").
        
          
        

**US 3.3: Cálculo de Racha y "Mejor Marca"**

  

- **Como** usuario, **quiero** ver mi racha actual (Current Streak) y mi récord histórico (Best Streak) por Épica **para** motivarme a no dejar caer el contador a cero.
    
      
    
- **Criterios de Aceptación:**
    
      
    - En el _dashboard_, cada Épica muestra un contador de fuego (🔥) con los días consecutivos de la racha actual.
        
          
        
    - La racha suma 1 por cada día en el que el registro en `daily_epic_logs` para esa Épica sea mayor a 0.
        
          
        
    - Si hoy no se ha completado nada, pero ayer sí, la racha se mantiene intacta esperando tu acción de hoy. Si el día de ayer cerró en 0, la racha cae a 0.
        
          
        

**US 3.4: Regla de Descanso (Weekend Freeze)**

  

- **Como** usuario, **quiero** que el algoritmo de rachas ignore la inactividad durante sábados y domingos **para** poder desconectar el fin de semana sin perder el progreso de toda la semana.
    
      
    
- **Criterios de Aceptación:**
    
      
    - En la lógica de cálculo del _Streak_, si el día evaluado es un sábado o domingo y la cantidad completada es 0, el contador **no se rompe** (no vuelve a 0), simplemente mantiene el número del viernes.
        
          
        
    - Si el usuario decide proactivamente completar una tarea en fin de semana, ese día sí suma +1 a la racha total como recompensa por el esfuerzo extra.

## Módulo 4: Tareas recurrentes

_Evitar crear la misma tarea todos los días: una tarea, muchos empujes._

**US 4.1: Tareas recurrentes (una tarea, N completados)**

- **Como** usuario, **quiero** definir una periodicidad para una tarea y marcarla como completada cada vez que la hago **para** no crear tareas repetidas del mismo hábito o actividad (ej. ver una clase del curso todos los días).

- **Detalles Técnicos (Esquema):** `todos.recurrence` (enum: `none`, `daily`, `weekdays`, `weekly`, `monthly`); tabla `todo_completions` (`id`, `todo_id` fk, `user_id`, `completed_at`) como historial de cada empujón de una tarea recurrente.

- **Criterios de Aceptación:**

    - Se puede elegir la periodicidad al crear o editar la tarea: nunca, diaria, días hábiles (L–V), semanal o mensual; por defecto "nunca".

    - La tarea recurrente nunca pasa a `done`: cada clic en el check registra un completado con fecha y hora, y el contador del período (`×N hoy/esta semana/este mes`) se incrementa.

    - El período se reinicia en calendario local: el día a las 00:00, la semana el lunes y el mes el día 1.

    - Cada completado alimenta el heatmap (intensidad por cantidad) y la racha (actividad del día) igual que una tarea normal.

    - Se puede deshacer el último completado y ver el historial reciente en el detalle de la tarea.

    - Las tareas sin recurrencia conservan el comportamiento actual (`status = done` + `completed_at`), sin regresiones de paridad.

## Módulo 5: App móvil (Flutter)

_Llevar el empuje diario al teléfono, con la misma cuenta y datos que el desktop._

**US 5.1: App Android con paridad funcional**

- **Como** usuario, **quiero** una app Android con mi cuenta de SisyFlow **para** registrar mis empujes diarios desde el teléfono sin abrir la computadora.

- **Detalles Técnicos:** Flutter + Material Design 3, `supabase_flutter` con publishable key + RLS, misma base de datos y RPCs que el desktop ([[ADR-015 App movil Flutter (Android)]]).

- **Criterios de Aceptación:**

    - Login/registro con email y contraseña, sesión persistente y deep link `sisyflow://auth/callback` para confirmar el correo.

    - Paridad funcional: épicas, proyectos (estados y colores), tareas (estado, prioridad, urgencia, vencimiento), tags, búsqueda, orden y filtros.

    - Tareas recurrentes con periodicidad, contador del período, deshacer e historial (US 4.1).

    - Gamificación: heatmap de 365 días (global o por épica), racha actual y mejor marca, y «Tareas del día» con check en vivo.

    - Editor de contenido enriquecido por tarea con los bloques de BlockNote soportados.

    - Ajustes: tema claro/oscuro/sistema, cuenta y backup JSON compatible con el desktop (v4).

    - UI Material Design 3 (tema semilla `#6750A4`), en español y con UI optimista que revierte con aviso si falla la red.