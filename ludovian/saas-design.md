# MVP: Ludovian

> Nombre: **Ludovian**  
> Dominios: `ludovian.com` y `ludovian.ai`

## 1. Visión

Ludovian es una plataforma web para crear videojuegos mediante agentes de IA.

El usuario no empieza escribiendo código. Empieza definiendo el juego mediante un wizard, edición manual y conversaciones con agentes. El sistema transforma esa información en tres capas:

1. GDD — Game Design Document  
2. TDD — Technical Design Document  
3. Implementation Plans — planes deterministas implementables  

Solo cuando un plan es determinista, el agente puede implementarlo.

---

## 2. Principio central

Separación estricta entre:

- diseño (GDD)
- definición técnica (TDD)
- implementación (planes)

No se permite pasar de idea vaga a código.

---

## 3. Capas

### 3.1 GDD

Contiene:

- género
- cámara
- estilo visual
- personajes
- enemigos
- niveles
- combate
- progresión
- assets

Cada campo puede ser:

- definido por usuario
- inferido por IA
- default

Se muestra coverage al usuario.

---

### 3.2 TDD

Traduce diseño a arquitectura:

- módulos
- entidades
- componentes
- escenas
- datos
- eventos
- físicas
- animaciones

---

### 3.3 Plan

Unidad mínima implementable.

Debe ser:

- concreto
- completo
- sin ambigüedades

---

## 4. Guardrail de determinismo

Cada plan pasa por validación:

- boolean: ¿es implementable?
- porcentaje de completitud
- lista de ambigüedades
- recomendaciones

Solo si es `true` se implementa.

---

## 5. Tipos de prompts

### Definición

Iterativo, exploratorio.

No implementa.

### Implementación

Solo sobre planes aprobados.

---

## 6. Flujo usuario

### Registro

- signup
- pago
- compra créditos
- creación API key OpenRouter

---

### Git

- conexión GitHub
- creación repo
- commits automáticos

---

### Wizard inicial

Sin IA.

Define estructura base del juego.

---

### GDD inicial

Generado por IA.

Incluye:

- decisiones usuario
- inferencias
- defaults

---

### Primera versión jugable

Generada rápido con defaults.

---

## 7. UI

- wizard
- editor GDD
- editor TDD
- editor planes
- vista coverage
- preview juego
- consola agente

---

## 8. Agent Loop

Patrón único:

input → modelo → (texto o tool) → repetir

---

## 9. OpenRouter

Uso en MVP:

- API unificada
- multi-modelo
- fallback
- API key por usuario
- límite de crédito

---

## 10. Billing

- crédito por usuario
- API key con límite
- corte automático al agotar

---

## 11. Límites

- max iteraciones
- timeout
- max tool calls
- max ejecución terminal
- max concurrencia

---

## 12. Progreso

Detectar:

- cambios reales
- repetición
- errores persistentes

---

## 13. Tools MVP

- terminal sandbox
- filesystem básico
- git
- assets

---

## 14. Sandbox

- contenedor aislado
- límites CPU/RAM
- sin acceso host
- reconstruible desde git

---

## 15. Frontend / Backend

Frontend:

- UI
- eventos

Backend:

- loop agente
- tools
- estado
- OpenRouter
- GitHub

Comunicación:

- SSE

---

## 16. Streaming

- mostrar progreso
- mostrar pasos
- reemplazar con resultado final

---

## 17. Commits

Todo cambio → commit

---

## 18. Steam (futuro)

Wizard para publicación:

- assets
- metadata
- requisitos

---

## 19. Arquitectura

Frontend:

- React o similar

Backend:

- API
- agentes
- sandbox
- GitHub

---

## 20. Agentes

- GDD Agent
- TDD Agent
- Planning Agent
- Implementation Agent
- Review Agent

---

## 21. Estados plan

- draft
- incomplete
- deterministic
- approved
- implementing
- done

---

## 22. Validación

- boolean
- porcentaje
- faltantes
- recomendaciones

---

## 23. Scope MVP

Un solo stack:

- Phaser o Godot 2D

---

## 24. MVP objetivo

Usuario puede:

- crear cuenta
- pagar
- conectar Git
- generar GDD
- generar TDD
- aprobar plan
- implementar
- ver juego

---

## 25. Riesgos

- coste → límite créditos
- loops → límites + progreso
- seguridad → sandbox
- UX → streaming

---

## 26. Propuesta valor

No es “genera código”.

Es:

> Diseña, define e implementa juegos de forma controlada y trazable.

---

## 27. Resumen

Ludovian permite crear juegos paso a paso con IA.

Separa diseño, técnica e implementación.

Usa OpenRouter para coste controlado.

Todo acaba en Git.

El usuario siempre mantiene control.
