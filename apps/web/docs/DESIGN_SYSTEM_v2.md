# Guerrilla RS - Design System

## Filosofía Solarpunk

Guerrilla RS adopta una estética **Solarpunk**: la fusión armoniosa entre naturaleza y tecnología. No es un "tema verde" superficial, sino una filosofía de diseño que permea cada componente.

### Principios Fundamentales

1. **Orgánico sobre Geométrico**: Formas curvas, bordes suaves, inspiración en la naturaleza
2. **Crecimiento sobre Construcción**: Elementos que "fluyen" y "crecen" en lugar de aparecer rígidos
3. **Vida sobre Máquina**: Metáforas naturales (jardín, energía, raíces) en lugar de técnicas
4. **Luz sobre Oscuridad**: Paleta luminosa, sombras suaves, sensación de apertura

## Paleta de Colores

### Colores Primarios

```css
--color-primary-50: #ecfdf5;   /* Mint más claro */
--color-primary-100: #d1fae5;  /* Mint claro */
--color-primary-200: #a7f3d0;  /* Mint */
--color-primary-300: #6ee7b7;  /* Mint medio */
--color-primary-400: #34d399;  /* Esmeralda claro */
--color-primary-500: #10b981;  /* Esmeralda */
--color-primary-600: #059669;  /* Esmeralda oscuro */
--color-primary-700: #047857;  /* Bosque */
--color-primary-800: #065f46;  /* Bosque oscuro */
--color-primary-900: #064e3b;  /* Bosque profundo */
```

### Colores de Acento

```css
--color-accent-sun: #f59e0b;      /* Sol - energía */
--color-accent-sun-light: #fbbf24; /* Sol brillante */
--color-accent-earth: #92400e;    /* Tierra */
--color-accent-sky: #0ea5e9;      /* Cielo */
```

### Colores Semánticos

```css
--color-success: #059669;
--color-warning: #f59e0b;
--color-error: #dc2626;
--color-info: #0ea5e9;
```

### Colores Neutros

```css
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

## Tipografía

### Familia

- **Primaria**: Inter (sans-serif) - Legible, moderna, amigable
- **Monospace**: JetBrains Mono - Para código y datos técnicos

### Escala

| Nombre | Tamaño | Peso | Uso |
|--------|--------|------|-----|
| Display | 2.5rem (40px) | 700 | Títulos de página |
| H1 | 2rem (32px) | 700 | Encabezados principales |
| H2 | 1.5rem (24px) | 600 | Secciones |
| H3 | 1.25rem (20px) | 600 | Subsecciones |
| Body | 1rem (16px) | 400 | Texto principal |
| Small | 0.875rem (14px) | 400 | Texto secundario |
| XS | 0.75rem (12px) | 500 | Etiquetas, captions |

## Espaciado

### Sistema de 4px

```css
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
```

## Bordes y Radios

### Radio de Esquina

```css
--radius-sm: 8px;     /* Botones pequeños, tags */
--radius-md: 12px;    /* Inputs, cards */
--radius-lg: 16px;    /* Cards principales */
--radius-xl: 24px;    /* Posts, modales */
--radius-full: 9999px; /* Avatares, pills */
```

### Sombras

```css
/* Sutil */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);

/* Default */
--shadow-md: 
  0 1px 3px rgba(0, 0, 0, 0.05),
  0 4px 12px rgba(5, 150, 105, 0.08);

/* Elevada */
--shadow-lg: 
  0 4px 12px rgba(0, 0, 0, 0.08),
  0 8px 24px rgba(5, 150, 105, 0.12);

/* Hover */
--shadow-hover:
  0 8px 24px rgba(0, 0, 0, 0.12),
  0 16px 48px rgba(5, 150, 105, 0.16);
```

## Componentes

### OrganicButton

Botón con forma orgánica, bordes redondeados y gradientes suaves.

**Variantes:**
- `primary`: Gradiente esmeralda, para acciones principales
- `secondary`: Fondo blanco, borde gris
- `ghost`: Transparente, para acciones secundarias
- `danger`: Gradiente rojo, para acciones destructivas

**Tamaños:**
- `sm`: Compacto, para espacios reducidos
- `md`: Default, uso general
- `lg`: Destacado, CTAs importantes

### PostCard

Tarjeta de publicación con:
- Bordes redondeados (24px)
- Sombra suave con tinte verde
- Efecto hover: elevación suave
- Metáfora de "crecimiento"

### BottomNav

Navegación móvil inspirada en raíces:
- 5 items principales
- Icono central destacado (Crear)
- Indicadores sutiles
- Sin bordes duros

## Metáforas de Interfaz

### En lugar de "Like" → "Energía Solar"

- Icono: ☀️ / 🌤️
- Acción: "Compartir energía"
- Visual: Brillo/pulso al activar

### En lugar de "Feed" → "Jardín"

- Concepto: Cultivar, crecer, florecer
- Posts = "plantas" que crecen
- Interacciones = "nutrir"

### En lugar de "Follow" → "Conectar"

- Concepto: Raíces entrelazadas
- Seguidores = "conexiones"
- Red = "ecosistema"

## Animaciones

### Principios

1. **Suaves, no bruscas**: Easing curves naturales
2. **Rápidas, no lentas**: 200-300ms máximo
3. **Con propósito**: Guiar atención, no decorar

### Transiciones Comunes

```css
/* Hover suave */
transition: transform 0.2s ease, box-shadow 0.2s ease;

/* Aparecer */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pulso de energía */
@keyframes energyPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

/* Spinner orgánico */
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Responsive

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Móvil grande */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Desktop grande */
```

### Patrones

- **Mobile-first**: Diseñar para móvil, escalar hacia arriba
- **Bottom nav**: Solo en móvil (< 768px)
- **Sidebar**: Nunca fija, siempre accesible
- **Feed**: Ancho máximo 600px, centrado

## Accesibilidad

### Contraste

- Texto principal: Ratio mínimo 4.5:1
- Texto grande: Ratio mínimo 3:1
- Elementos interactivos: Siempre visibles

### Interacción

- Tamaño mínimo táctil: 44x44px
- Estados de foco visibles
- Animaciones respetan `prefers-reduced-motion`

### Iconografía

- Siempre con label o aria-label
- No depender solo del color
- Texto alternativo descriptivo

## Ejemplos de Uso

### Card de Post

```svelte
<article class="post-card">
  <!-- Header con avatar y nombre -->
  <header>...</header>
  
  <!-- Contenido -->
  <div class="content">...</div>
  
  <!-- Acciones: Energía, Comentarios, Compartir -->
  <footer>...</footer>
</article>

<style>
  .post-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    box-shadow: var(--shadow-md);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .post-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
</style>
```

### Botón Primario

```svelte
<OrganicButton variant="primary" size="md">
  Compartir energía
</OrganicButton>
```

---

*"La tecnología debe ser como un jardín: un espacio vivo que nutre, no una máquina que consume."*
