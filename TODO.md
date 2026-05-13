# TODO: Evolución y Modularización — DBS2 Parcial

---

## Fase 1: Desacoplamiento de Datos ✅
- [x] Crear `data/theory.ts` para conceptos teóricos
- [x] Crear `data/practice_quick.ts` para práctica rápida
- [x] Mantener `data/questions.ts` solo para preguntas estructurales

## Fase 2: Implementación de Secciones ✅
- [x] Arquitectura de carpeta `pages/` con router independiente (`AppRouter.tsx`)
- [x] Sección Conceptos (`/conceptos`) con cards por categoría y subgrupo
- [x] Sección Práctica (`/practica`) — identificación Fact vs Dimension
- [x] Sección Ejercicios (`/ejercicios`) — banco de acceso directo a los 10 puntos
- [x] Sección Integrador (`/integrador`) — simulacro completo

## Fase 3: Infraestructura y Persistencia ✅
- [x] Single Tunnel ngrok — Nginx como único punto de entrada
- [x] Auto-Sync MongoDB — login registra/actualiza usuario automáticamente
- [x] Progress Service — progreso persistente entre sesiones

## Fase 4: Roles y Contenido Editable ✅
- [x] Sistema de roles `student` / `admin` en MongoDB
- [x] Super-admins via `ADMIN_EMAILS` env var (permanentes, no desmotables)
- [x] Rol incluido en JWT de sesión y en `/api/me`
- [x] Panel admin (`/admin`) — gestión de usuarios y editor de contenido
- [x] Editor dual (Visual / JSON) con validación estructural de esquemas
- [x] Soporte visual para subgrupos teóricos y múltiples tipos de práctica
- [x] Flashcards 3D con carrusel aleatorio y seguimiento de aprendizaje
- [x] `ContentContext` — carga contenido de MongoDB con fallback estático
- [x] Estructura jerárquica en `theory.ts` (`ConceptCategory[]` con subgrupos)

## Fase 5: SQL Training Module ✅
- [x] `data/sql_practice.ts` — ejercicios SQL por niveles (`facil` | `intermedio` | `avanzado` | `reto`)
- [x] `/ejercicios` reconvertido en SQL Training Module con ruta de aprendizaje progresiva
- [x] Sidebar con estado de completitud por ejercicio (persiste en `ProgressContext`)
- [x] `sqlPractices` integrado en `ContentContext` con fetch/save desde MongoDB
- [x] Editor visual de `sqlPractices` en panel admin (`/admin` → tab Contenido)
- [x] Navbar: "Ejercicios" renombrado a "SQL Training"

## Fase 6: Mejoras y Herramientas Avanzadas ✅
- [x] **Modo Examen (Cronometrado):** sección `/cronometrado` con configuración de tiempo/preguntas, timer dinámico y resumen de resultados.
- [x] **Glosario DWH:** sección `/glosario` con búsqueda y filtros por categorías base (Modelado, Tablas, Análisis).
- [x] **DWH Schema Builder:** tab "Esquemas DWH" en el panel admin para construir diagramas visualmente con auto-layout y edición de tablas/conexiones.
- [x] **Editor de Esquemas en Modal:** implementación de `Modal.tsx` para permitir la edición de diagramas DWH en pantalla completa, mejorando la comodidad del admin.
- [x] **Integración schema-question:** soporte para nuevos ejercicios de tipo "Esquema + Preguntas" que vinculan diagramas personalizados con preguntas MC.

## Fase 7: Pendiente
- [ ] **Actualizar `dex/README.md`:** agregar sección sobre roles y flujo de registro en MongoDB
- [ ] **Exportación de Datos:** botón para exportar progreso o contenido editado a CSV/JSON desde el panel admin.
