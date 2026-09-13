---
name: Premium Auto Ledger
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#184fd6'
  on-secondary: '#ffffff'
  secondary-container: '#3d6af0'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001c38'
  on-tertiary-container: '#2a87dd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164f'
  on-secondary-fixed-variant: '#003ab1'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a1c9ff'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#004880'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system is engineered to evoke a sense of high-performance luxury and frictionless utility, specifically tailored for a premium automotive experience. It targets a discerning audience that values precision, speed, and tactile quality. 

The design style is **Corporate / Modern** with a strong influence from **Glassmorphism**. It utilizes expansive white space, subtle translucent layers for overlays, and a sophisticated depth model that feels native to high-end operating systems. The aesthetic is clean, professional, and reliable, ensuring that the vehicle data and booking flows remain the focal point.

## Colors

The palette is anchored by a high-contrast foundation. **Primary Black (#000000)** is reserved for core branding, primary buttons, and heavy headings to ensure an authoritative presence. **Secondary Blue (#3563E9)** serves as the functional driver, used for primary actions, active states, and focus indicators.

The background system utilizes a tiered neutral approach. In light mode, **Neutral Gray (#F6F7F9)** provides a soft canvas that reduces eye strain compared to pure white, while pure white is used for card surfaces to create "lift." In dark mode, the surfaces invert to deep charcoals and obsidian tones, maintaining the same hierarchy of depth through tonal shifts rather than pure black backgrounds.

## Typography

This design system utilizes **Inter** exclusively to achieve a systematic, utilitarian, and premium tech aesthetic. The typeface's tall x-height and excellent legibility at small sizes make it ideal for data-dense automotive specs.

Headlines use tighter letter-spacing and heavier weights to feel "impactful" and "mechanical." Body text remains at a medium weight (500) for primary descriptions to maintain the premium feel, while standard weight (400) is reserved for secondary metadata. All "Display" and "Headline Large" styles must scale down for mobile viewports to prevent awkward line breaks on car model names.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain a premium, editorial feel, centering content within a 1280px container. It utilizes a 12-column grid with generous 24px gutters to allow the high-quality vehicle imagery room to breathe.

Spacing follows an 8px linear scale. For vertical rhythm, use 32px or 48px between major sections. On mobile, the margins tighten to 20px, and the grid collapses to a single column, prioritizing full-bleed card components to maximize touch targets and image visibility.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**. Surfaces do not use harsh borders; instead, they are separated by subtle shifts in background color or extremely soft, diffused shadows.

- **Level 0 (Background):** Neutral Gray (#F6F7F9).
- **Level 1 (Cards/Content):** Pure White with a 4% opacity black shadow, 20px blur, and 4px Y-offset.
- **Level 2 (Overlays/Modals):** Pure White with a "Glassmorphism" backdrop filter (20px blur) on the background, creating a sense of physical space.
- **Level 3 (Popovers):** Higher contrast shadow to indicate immediate priority.

## Shapes

The shape language is defined by a "High Corner Radius" philosophy, echoing the aerodynamic curves of modern automotive design. The standard `rounded-md` (0.5rem) is used for small components like tags and inputs. 

Primary containers and vehicle cards must use `rounded-lg` (1rem) or `rounded-xl` (1.5rem) to maintain the friendly yet sophisticated iOS-inspired aesthetic. Action buttons that are not "pill-shaped" should default to 10px or 12px radii to feel substantial and tactile.

## Components

**Buttons:**
- **Primary:** Solid Black or Secondary Blue with 12px rounded corners. Large padding (16px 32px) for a premium feel.
- **Secondary:** Transparent with a 1px soft border or a light blue tinted background.

**Cards:**
- Vehicle cards should feature a subtle hover state where the shadow deepens and the image scales slightly (1.02x). Ensure content inside cards uses the 24px internal padding for a spacious look.

**Inputs & Search:**
- Use "Surface-Level" inputs (White backgrounds on Gray pages). Icons should be used prefix-side to aid quick scanning of features (e.g., fuel pump icon for gas type).

**Chips/Tags:**
- Used for car categories (Sport, SUV, etc.). Use low-saturation backgrounds with high-saturation text to keep them from distracting from the primary CTA.

**Selection Controls:**
- Checkboxes and Radios should use the Secondary Blue for active states. Use a 4px radius for checkboxes to match the overall rounded aesthetic.