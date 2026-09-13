---
name: Premium Automotive High-Fidelity
colors:
  surface: '#10131b'
  surface-dim: '#10131b'
  surface-bright: '#363942'
  surface-container-lowest: '#0b0e16'
  surface-container-low: '#181c23'
  surface-container: '#1c2028'
  surface-container-high: '#272a32'
  surface-container-highest: '#31353d'
  on-surface: '#e0e2ed'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e0e2ed'
  inverse-on-surface: '#2d3039'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#c2c1ff'
  on-secondary: '#1c0b9f'
  secondary-container: '#3834b6'
  on-secondary-container: '#b2b1ff'
  tertiary: '#ffb595'
  on-tertiary: '#571e00'
  tertiary-container: '#ef6719'
  on-tertiary-container: '#4c1a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006a'
  on-secondary-fixed-variant: '#3631b4'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#10131b'
  on-background: '#e0e2ed'
  surface-variant: '#31353d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
This design system is engineered for high-performance automotive interfaces, prioritizing immediate legibility, technical precision, and a premium "cockpit" feel. The aesthetic leans into **Corporate Modern** with a **Glassmorphic** edge to simulate the depth of high-end vehicular displays. 

The dark mode execution focuses on reducing ocular strain during night driving while maintaining high-contrast touch targets. The atmosphere is sophisticated and athletic, utilizing deep blacks and vibrant functional blues to evoke a sense of advanced technology and reliability.

## Colors
The palette is rooted in a deep `#121212` canvas to maximize contrast and minimize light pollution in a cabin environment. 

- **Primary**: The high-visibility iOS Blue (#007AFF) serves as the primary action color, ensuring interactive elements are unmistakable.
- **Surface Strategy**: Tonal stepping is used to define hierarchy. `#1E1E1E` is the standard container color for grouped information.
- **Typography Colors**: Primary text uses pure white for maximum "pop" against the dark background, while secondary information uses a translucent-effect hex (`#EBEBF5`) to establish visual hierarchy without sacrificing readability.
- **Semantic Colors**: All status colors are shifted to their "Vibrant" dark-mode equivalents to ensure they meet WCAG contrast requirements against dark grey surfaces.

## Typography
The typography system utilizes **Inter** across all levels for its exceptional legibility and neutral, technical character. 

For automotive use cases, font sizes are slightly oversized compared to standard web defaults to accommodate for vibration and distance from the eye. Headlines use semi-bold weights and slight negative letter-spacing to appear tighter and more "designed." Labels and status text use increased letter-spacing to ensure characters don't blur together at low brightness.

## Layout & Spacing
This design system uses a strictly enforced **8px grid system**. In an automotive context, touch targets must be generous; therefore, the minimum interactive area is 48x48px, even if the visual element is smaller.

- **Desktop/Console**: 12-column fluid grid with 24px gutters.
- **Tablet/Cluster**: 8-column grid with 24px gutters.
- **Mobile/Remote**: 4-column grid with 16px gutters.
Margins are set at 32px to ensure content is kept away from the physical bezel of the display hardware.

## Elevation & Depth
In this dark mode environment, depth is communicated through **Tonal Elevation** and **Inner Glows** rather than heavy drop shadows.

- **Level 1 (Surface)**: `#121212` - The base background.
- **Level 2 (Platters)**: `#1E1E1E` - Standard cards and buttons.
- **Level 3 (Overlays)**: `#2C2C2C` - Modals and popovers.

To enhance the high-fidelity feel, elevated elements should feature a 1px "inner stroke" (top-down) at 10% white opacity to simulate a light source hitting the top edge of the component. Background blurs (20px-40px) should be applied to all overlay surfaces to maintain context of the underlying map or data visualizations.

## Shapes
The design system employs a **Rounded (8px)** corner strategy across all UI components. This choice balances the geometric precision of the car's interior with a touch-friendly, ergonomic feel. 

- **Containers & Cards**: Use `rounded-lg` (16px).
- **Buttons & Inputs**: Use the base `rounded` (8px).
- **Status Pills**: Use `rounded-xl` (24px) or full pill-shape for distinct differentiation from action buttons.

## Components

### Buttons
- **Primary**: Solid `#007AFF` with white text. High-contrast, no gradient.
- **Secondary**: Ghost style with `#007AFF` border and text, or a subtle `#FFFFFF` at 10% opacity fill for lower hierarchy actions.

### Input Fields
Inputs use the `#1E1E1E` surface container with a 1px stroke of `#EBEBF5` at 20% opacity. Upon focus, the stroke changes to the primary `#007AFF`.

### Cards
Cards are the primary container for telemetry data. They must use the `#1E1E1E` background. Titles within cards use the `title-md` type spec in primary white.

### Specialized Automotive Components
- **Value Readouts**: Large numeric displays (e.g., Speed, Temp) use `display-lg` for instant recognition.
- **Gauges**: Circular or linear indicators should use the semantic colors (Success for green-zones, Error for red-lines) with a 20% glow effect of the same color to simulate hardware illumination.
- **Selection Chips**: Used for climate control or drive modes. When active, they should utilize the primary color fill with a subtle outer glow to indicate the "active" state in low-light conditions.