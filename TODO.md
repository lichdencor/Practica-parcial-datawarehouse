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

## Fase 5: Pendiente
- [ ] **Modo Examen:** botón "Finalizar y Ver Resultados" en el Integrador en lugar de mostrar explicaciones de inmediato
- [ ] **Actualizar `dex/README.md`:** agregar sección sobre roles y flujo de registro en MongoDB
