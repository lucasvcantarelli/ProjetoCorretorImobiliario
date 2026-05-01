---
name: Ethereal Estate
colors:
  surface: '#fff8f3'
  surface-dim: '#e0d9d2'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ec'
  surface-container: '#f4ece6'
  surface-container-high: '#eee7e0'
  surface-container-highest: '#e9e1db'
  on-surface: '#1e1b17'
  on-surface-variant: '#4f453c'
  inverse-surface: '#33302c'
  inverse-on-surface: '#f7efe9'
  outline: '#81756a'
  outline-variant: '#d3c4b8'
  surface-tint: '#795834'
  primary: '#775532'
  on-primary: '#ffffff'
  primary-container: '#926d48'
  on-primary-container: '#fffbff'
  inverse-primary: '#ebbe93'
  secondary: '#635d5a'
  on-secondary: '#ffffff'
  secondary-container: '#e6ded9'
  on-secondary-container: '#67625e'
  tertiary: '#3f6072'
  on-tertiary: '#ffffff'
  tertiary-container: '#58798b'
  on-tertiary-container: '#fbfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcbd'
  primary-fixed-dim: '#ebbe93'
  on-primary-fixed: '#2c1600'
  on-primary-fixed-variant: '#5f401f'
  secondary-fixed: '#e9e1dc'
  secondary-fixed-dim: '#cdc5c0'
  on-secondary-fixed: '#1e1b18'
  on-secondary-fixed-variant: '#4b4642'
  tertiary-fixed: '#c5e7fc'
  tertiary-fixed-dim: '#a9cbe0'
  on-tertiary-fixed: '#001e2b'
  on-tertiary-fixed-variant: '#294b5c'
  background: '#fff8f3'
  on-background: '#1e1b17'
  surface-variant: '#e9e1db'
typography:
  headline-xl:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-page: 64px
  section-gap: 120px
---

## Brand & Style

This design system is built for the high-end luxury real estate market, targeting a discerning clientele that values heritage, modernism, and understated elegance. The brand personality is "Quiet Luxury"—it does not shout; it resonates through quality and space.

The design style combines **Minimalism** with **Modern Corporate** influences. It utilizes significant whitespace (or "air") to allow high-resolution architectural photography to breathe. By replacing stark white with a warmer, organic base, the UI evokes an emotional response of comfort, stability, and exclusivity. The aesthetic is editorial, reminiscent of high-end architectural digests, ensuring the interface feels like an extension of a physical luxury environment.

## Colors

The palette is anchored by the primary accent, a muted metallic bronze (#AC855E), used strategically for calls to action and highlights to signify value and craft. The background is a sophisticated off-white (#F7F5F2), which reduces ocular strain compared to pure white and provides a warmer canvas for property imagery.

Secondary colors are deep charcoals rather than pure blacks to maintain a soft, premium contrast. Neutral tones are used for secondary text and decorative borders, ensuring a harmonious transition between the background and the content.

## Typography

This design system employs a sophisticated pairing of **Noto Serif** for headlines and **Manrope** for functional text. Noto Serif provides a classic, authoritative, and literary feel essential for luxury branding. Headlines should be set with generous line height and slightly tightened letter spacing for a modern, editorial appearance.

Manrope is used for body copy and labels to maintain high readability and a balanced, professional tone. All labels and overlines should utilize the `label-caps` style with increased letter spacing to create a sense of organized hierarchy and architectural precision.

## Layout & Spacing

The layout utilizes a **Fixed Grid** model centered on a 1224px or 1280px max-width container to ensure a premium, gallery-like presentation. Spacing follows an 8px rhythmic scale, but emphasizes "macro-spacing"—large gaps between sections (120px+) to prevent the interface from feeling cluttered.

A 12-column grid is standard, with 24px gutters. Elements should often span multiple columns to create asymmetrical, modern compositions. Large photographic hero sections should either be full-bleed or inset with 64px margins to frame the content like a piece of art.

## Elevation & Depth

This design system avoids heavy shadows, instead relying on **Tonal Layers** and **Low-Contrast Outlines**. Depth is created by placing white (#FFFFFF) cards atop the beige (#F7F5F2) background, creating a very subtle, natural lift.

Where depth must be emphasized (e.g., for modal windows or floating navigation), use **Ambient Shadows**: extremely diffused (30px-50px blur), low-opacity (5-8%) shadows with a slight tint of the primary bronze or neutral charcoal to prevent a "dirty" look. Interactive elements may use a 1px border in a slightly darker neutral shade to define boundaries without adding visual weight.

## Shapes

The shape language is "Soft Modern." We use a conservative roundedness level to maintain a professional and architectural feel. Standard UI components like buttons and input fields use a `0.25rem` (4px) radius, while larger cards or image containers may go up to `0.75rem` (12px). This subtle rounding softens the edges of the high-contrast photography without veering into the playfulness of consumer apps.

## Components

- **Buttons:** Primary buttons use the accent color (#AC855E) with white text. Secondary buttons should be ghost-style with a 1px border in the accent color or a solid white background with a subtle shadow.
- **Input Fields:** Use a minimalist approach—solid white backgrounds, 1px neutral-light borders, and Manrope typography. Focus states should transition the border color to the primary bronze.
- **Cards:** Property cards should be borderless with a white background and a very soft ambient shadow on hover. Images within cards must maintain a consistent aspect ratio (e.g., 4:3 or 16:9).
- **Navigation:** A sticky top navigation with a high-blur backdrop filter (glassmorphism) allows the background color to bleed through while maintaining readability.
- **Property Badges:** Use the `label-caps` typography style on small, pill-shaped chips with a low-opacity version of the accent color or a simple white fill.
- **Image Galleries:** Should include "expand" functionality with high-quality transitions, prioritizing the visual asset over UI controls.