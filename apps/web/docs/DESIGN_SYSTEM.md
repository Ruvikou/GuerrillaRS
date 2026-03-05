# Guerrilla RS - Design System
## Sistema de Diseño Solarpunk: "Bosque Digital"

> **Filosofía**: La tecnología debe crecer orgánicamente, como un bosque. No imitamos las redes sociales tradicionales; creamos algo que respira.

---

## 🌿 Principios Fundamentales

### 1. Anti-Patrones (NO copiar)

Estos patrones están **EXPRESAMENTE PROHIBIDOS**:

| Anti-Patrón | Por qué no | Alternativa Solarpunk |
|-------------|-----------|----------------------|
| Sidebar izquierda fija | Atrapa al usuario, ocupa espacio innecesario | Navegación bottom en mobile, flotante en desktop |
| Botón "Like" con corazón | Metáfora gastada, emocionalmente manipuladora | "Energía Solar" - un sol que crece |
| Campana de notificaciones arriba-derecha | Ansiedad inducida, FOMO | Badge sutil en avatar, accesible sin ser intrusivo |
| Feed infinito sin fin | Adicción por diseño, sin control usuario | Paginación consciente o "cargar más" explícito |
| Perfil circular con borde azul | Clone de Twitter/X | Forma orgánica asimétrica, borde degradado natural |
| Likes públicos | Presión social, conformidad | Privados por defecto, visible solo para autor |
| Algoritmo de feed | Manipulación de atención | Cronológico puro, filtros manuales |

### 2. Patrones Originales Solarpunk

#### Metáforas Naturales

- **Crecimiento**: Las interacciones "crecen" como plantas
- **Energía Solar**: El "like" es energía que nutre contenido
- **Semillas**: Compartir es plantar una semilla que puede germinar
- **Micelio**: Las conexiones entre usuarios son como hongos subterráneos
- **Raíces**: La historia/linaje de un post (respuestas, citas)

#### Navegación

```
Mobile (Bottom Navigation):
┌─────────────────────────────────┐
│                                 │
│         [Contenido]             │
│                                 │
├─────┬─────┬─────────┬─────┬─────┤
│ 🌱  │ 🔍  │   🌻    │ 💬  │ 👤  │
│Feed │Expl.│  Crear  │ DMs │ Perfil
└─────┴─────┴─────────┴─────┴─────┘

Desktop (Floating Navigation):
- Barra superior flotante con blur
- Acciones contextuales en FAB (Floating Action Button)
- Sidebar colapsable (NO fija), invocable con gesto/swipe
```

---

## 🎨 Tokens de Diseño

### Paleta de Colores

#### Modo Oscuro (Default - Bosque Nocturno)

```css
:root {
  /* Fondos */
  --bg-primary: #0a0f1c;        /* Azul profundo, no negro puro */
  --bg-secondary: #111827;       /* Gris azulado */
  --bg-tertiary: #1a2234;        /* Elevación */
  --bg-elevated: #232b3d;        /* Cards, modales */
  
  /* Acentos Solarpunk */
  --moss: #059669;               /* Verde musgo - primario */
  --moss-light: #34d399;         /* Verde claro - hover */
  --moss-dark: #064e3b;          /* Verde oscuro - pressed */
  
  --amber: #d97706;              /* Ámbar/Oro - secundario */
  --amber-light: #fbbf24;        /* Ámbar claro */
  --amber-dark: #92400e;         /* Ámbar oscuro */
  
  /* Estados */
  --success: #10b981;            /* Brote nuevo */
  --warning: #f59e0b;            /* Sol naciente */
  --error: #ef4444;              /* Hoja seca */
  --info: #3b82f6;               /* Agua */
  
  /* Texto */
  --text-primary: #ecfdf5;       /* Verde muy claro */
  --text-secondary: #9ca3af;     /* Gris medio */
  --text-muted: #6b7280;         /* Gris oscuro */
  
  /* Bordes */
  --border: #1f2937;
  --border-focus: #059669;
}
```

#### Modo Claro (Jardín Diurno)

```css
[data-theme="light"] {
  --bg-primary: #f0fdf4;         /* Verde muy claro */
  --bg-secondary: #ffffff;
  --bg-tertiary: #f3f4f6;
  --bg-elevated: #ffffff;
  
  --moss: #047857;
  --moss-light: #059669;
  --moss-dark: #064e3b;
  
  --amber: #d97706;
  --amber-light: #fbbf24;
  --amber-dark: #92400e;
  
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;
  
  --border: #e5e7eb;
  --border-focus: #059669;
}
```

### Tipografía

```css
:root {
  /* Familias */
  --font-head: 'Inter', system-ui, sans-serif;
  --font-body: 'Source Sans 3', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Escalas */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Pesos */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Altura de línea */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Espaciado

```css
:root {
  /* Escala de 4px base */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Bordes y Radios

```css
:root {
  /* Radios asimétricos (orgánicos) */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem 0.75rem 0.625rem 0.875rem; /* Asimétrico */
  --radius-lg: 0.75rem 1.25rem 1rem 1.5rem;      /* Orgánico */
  --radius-xl: 1rem 1.5rem 1.25rem 2rem;
  --radius-full: 9999px;
  
  /* Grosor */
  --border-width: 1px;
  --border-width-focus: 2px;
}
```

### Animaciones y Easing

```css
:root {
  /* Easing orgánico - como el crecimiento de una planta */
  --ease-grow: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-sprout: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-wither: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bloom: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Duraciones */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;
}
```

---

## 🧬 Componentes UI Orgánicos

### 1. OrganicButton

Botón con forma orgánica asimétrica que "crece" al interactuar.

**Variantes:**
- `seed`: Acción primaria (verde, más prominente)
- `bloom`: Acción secundaria (ámbar, destacada)
- `root`: Acción terciaria (sutil, outline)
- `wither`: Acción destructiva (rojo)

**Estados:**
- Default: Radio asimétrico suave
- Hover: Crece ligeramente, brillo aumenta
- Active/Pressed: Se "contrae" como una semilla al ser plantada
- Disabled: Opacidad reducida, sin interacción

```svelte
<!-- Ejemplo de uso -->
<OrganicButton variant="seed" size="lg">
  🌱 Plantar idea
</OrganicButton>

<OrganicButton variant="bloom" size="md">
  🌻 Compartir
</OrganicButton>

<OrganicButton variant="root" size="sm">
  Cancelar
</OrganicButton>
```

### 2. EnergySolar (Reemplazo de "Like")

Un sol que crece con cada interacción. Privado por defecto.

**Comportamiento:**
- Sin interacción: Pequeño punto dorado
- Hover: Brillo suave, tooltip "Dar energía"
- Click: Sol crece con animación, emite partículas
- Contador: Solo visible para el autor del post

```
Estados visuales:
○ → ☀️ → ☀️✨ → ☀️✨🌟
(0)  (1)   (5)    (10+)
```

### 3. SeedButton (Compartir)

Una semilla que se "planta" para compartir contenido.

**Comportamiento:**
- Default: Semilla pequeña 🌰
- Hover: Semilla brilla, tooltip "Plantar semilla"
- Click: Semilla se planta, animación de brote
- Opciones: Compartir en feed, enviar a usuario, copiar enlace

### 4. Avatar Orgánico

Forma asimétrica que recuerda una hoja o pétalo.

```css
.avatar-organic {
  border-radius: 60% 40% 55% 45% / 45% 55% 45% 55%;
  transition: border-radius var(--duration-normal) var(--ease-grow);
}

.avatar-organic:hover {
  border-radius: 55% 45% 60% 40% / 55% 45% 55% 45%;
}
```

### 5. Card Orgánica

Tarjeta con bordes asimétricos y sombra orgánica.

```css
.card-organic {
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.05);
  transition: transform var(--duration-normal) var(--ease-grow),
              box-shadow var(--duration-normal) var(--ease-grow);
}

.card-organic:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 12px 24px rgba(0, 0, 0, 0.1);
}
```

### 6. FAB (Floating Action Button) - Forma Brote

Botón de acción principal con forma de brote emergiendo.

```css
.fab-sprout {
  width: 56px;
  height: 56px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: linear-gradient(135deg, var(--moss), var(--moss-light));
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
}

.fab-sprout:hover {
  border-radius: 55% 55% 45% 45% / 65% 65% 35% 35%;
  transform: scale(1.05);
}
```

---

## 📱 Layouts Responsivos

### Mobile First

```
Breakpoints:
- sm: 640px   (móvil grande)
- md: 768px   (tablet)
- lg: 1024px  (desktop pequeño)
- xl: 1280px  (desktop)
- 2xl: 1536px (desktop grande)
```

### Estructura de Página

```
┌─────────────────────────────────┐
│  Header Flotante (blur)         │  height: 64px, sticky
│  [Logo]    [Search]    [Avatar] │
├─────────────────────────────────┤
│                                 │
│         Contenido Principal     │  padding: var(--space-4)
│                                 │
│  ┌─────────────────────────┐    │
│  │  Card Orgánica          │    │
│  │  [Contenido]            │    │
│  │  [Energía] [Semilla]    │    │
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│  Bottom Navigation              │  height: 64px, fixed
│  [🌱] [🔍] [🌻] [💬] [👤]      │
└─────────────────────────────────┘
```

### Desktop

```
┌─────────────────────────────────────────────────────────┐
│  Header Flotante                                         │
│  [🌿 Logo]  [Search...]              [🔔] [👤 Avatar]   │
├──────────┬──────────────────────────────┬───────────────┤
│          │                              │               │
│ Sidebar  │     Feed Principal           │  Widgets      │
│ (collaps)│                              │  (opcional)   │
│          │  ┌────────────────────────┐  │               │
│ [🌱 Feed]│  │ Card Orgánica          │  │ [Trending]    │
│ [🔍 Exp] │  │                        │  │ [Sugerencias] │
│ [👤 Per] │  │                        │  │               │
│          │  └────────────────────────┘  │               │
│          │                              │               │
│          │  [FAB 🌻]                    │               │
│          │                              │               │
└──────────┴──────────────────────────────┴───────────────┘
```

---

## 🎭 Micro-interacciones

### Transiciones de Estado

```css
/* Hover suave */
.interactive {
  transition: all var(--duration-normal) var(--ease-grow);
}

/* Focus visible */
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.3);
}

/* Active/Pressed */
.pressed:active {
  transform: scale(0.98);
}

/* Skeleton loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Animaciones de Entrada

```css
/* Fade in + slide up */
@keyframes bloom-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Stagger para listas */
.stagger-children > * {
  animation: bloom-in var(--duration-normal) var(--ease-bloom) backwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
/* ... */
```

---

## ♿ Accesibilidad

### Requisitos WCAG 2.1 AAA

- **Contraste**: Mínimo 7:1 para texto normal, 4.5:1 para grande
- **Focus visible**: Todos los elementos interactivos tienen indicador de foco
- **Reducción de movimiento**: Respetar `prefers-reduced-motion`
- **Tamaño de toque**: Mínimo 44x44px para elementos interactivos
- **Etiquetas ARIA**: Todas las acciones tienen labels descriptivas

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🧪 Implementación

### Estructura de Archivos

```
src/lib/components/ui/
├── OrganicButton.svelte
├── EnergySolar.svelte
├── SeedButton.svelte
├── AvatarOrganic.svelte
├── CardOrganic.svelte
├── InputOrganic.svelte
├── ModalOrganic.svelte
└── index.ts
```

### Ejemplo: OrganicButton.svelte

```svelte
<script lang="ts">
  export let variant: 'seed' | 'bloom' | 'root' | 'wither' = 'seed';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  
  const variantClasses = {
    seed: 'btn-seed',
    bloom: 'btn-bloom',
    root: 'btn-root',
    wither: 'btn-wither'
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };
</script>

<button
  class="organic-button {variantClasses[variant]} {sizeClasses[size]}"
  class:disabled
  class:loading
  {disabled}
  on:click
  {...$$restProps}
>
  {#if loading}
    <span class="spinner" />
  {:else}
    <slot />
  {/if}
</button>

<style>
  .organic-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-family: var(--font-body);
    font-weight: var(--font-medium);
    border: none;
    cursor: pointer;
    transition: all var(--duration-normal) var(--ease-grow);
    position: relative;
    overflow: hidden;
  }
  
  /* Variantes */
  .btn-seed {
    background: linear-gradient(135deg, var(--moss), var(--moss-light));
    color: white;
    border-radius: var(--radius-lg);
  }
  
  .btn-seed:hover:not(.disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
  }
  
  .btn-bloom {
    background: linear-gradient(135deg, var(--amber), var(--amber-light));
    color: white;
    border-radius: var(--radius-lg);
  }
  
  .btn-root {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }
  
  .btn-root:hover:not(.disabled) {
    border-color: var(--moss);
    color: var(--moss);
  }
  
  /* Tamaños */
  .btn-sm { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); }
  .btn-md { padding: var(--space-3) var(--space-4); font-size: var(--text-base); }
  .btn-lg { padding: var(--space-4) var(--space-6); font-size: var(--text-lg); }
  
  /* Estados */
  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .loading .spinner {
    width: 1em;
    height: 1em;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

---

## 📋 Checklist de Implementación

- [ ] Variables CSS definidas en `:root`
- [ ] Modo claro/oscuro funcional
- [ ] OrganicButton implementado con todas las variantes
- [ ] EnergySolar (reemplazo de like) funcional
- [ ] SeedButton (compartir) implementado
- [ ] Avatar orgánico con forma asimétrica
- [ ] Navegación bottom en mobile
- [ ] FAB con forma de brote
- [ ] Animaciones respetan `prefers-reduced-motion`
- [ ] Contraste WCAG AAA verificado
- [ ] Focus visible en todos los elementos interactivos

---

**Versión**: 1.0.0  
**Última actualización**: 2026-03-06  
**Estado**: Listo para implementación
