# Design Guidelines: Die Roller Hackathon Skeleton

## Design Approach
**Material Design System** - Following Google's Material Design 3 principles with focus on clean, functional interface suitable for rapid hackathon development and LLM code generation.

## Core Design Elements

### Typography
- **Font Family**: Roboto (Material Design standard) via Google Fonts
- **Hierarchy**:
  - H1 (App Name): 2xl to 3xl, font-medium
  - H2 (Feature Title): xl to 2xl, font-medium
  - Body: base, font-normal
  - UI Labels: sm, font-medium
  - Footer: xs to sm, font-light
- Maintain 1.5 line-height for readability

### Layout System
**Tailwind Spacing Units**: Use 4, 8, 12, 16, 24 for consistent rhythm
- Container: max-w-4xl for main content, centered
- Vertical spacing: py-16 for sections, py-4 for header/footer
- Component gaps: gap-4 to gap-8

### Component Structure

**Header (Dark Mode)**
- Fixed position with backdrop-blur-md effect when scrolling
- Height: h-16
- Padding: px-6 md:px-12
- Layout: Flexbox with justify-between
- Left: Logo SVG (w-10 h-10) + App name (text-lg)
- Logo: Simple geometric shape (hexagon or cube) in Material teal accent
- Shadow: shadow-lg for depth when scrolled

**Main Body (Light Mode)**
- Padding-top: pt-20 (to clear fixed header)
- Centered vertical layout with generous spacing
- Focus area: Die roller occupies center stage

**Die Roller Interface**
- Central card component with Material elevation (shadow-xl)
- Card structure:
  - 3D Die visualization area: Large square container (w-80 h-80 max)
  - Controls section below die:
    - Slider input for sides (6-24) with Material styling
    - Current value display (text-2xl, font-bold)
    - Roll button: Large, rounded-full, Material FAB-style
  - Spacing: p-8 within card, gap-6 between elements
- Die as SVG: Isometric cube representation showing current number
- Animation: 3s rotation transform on roll

**Footer (Dark Mode)**
- Height: h-12 to h-16
- Centered copyright text
- Border-top with subtle divider
- Padding: py-4

### Responsive Breakpoints
**Mobile (base)**
- Single column, full-width components
- Die size: w-64 h-64
- Padding: px-4

**Tablet (md:)**
- Die size: w-72 h-72
- Padding: px-8

**Desktop (lg:)**
- Die size: w-80 h-80
- Padding: px-12
- Max-width container activated

### Accessibility
- Slider: aria-labels, keyboard navigation, min/max announcements
- Button: Clear focus states with ring-2 ring-offset-2
- Die result: aria-live region for screen reader announcement
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Touch targets: minimum 44x44px for mobile

### Material Design Specifics
- Elevation system: Use shadow-sm, shadow-md, shadow-lg, shadow-xl
- Rounded corners: rounded-lg for cards, rounded-full for FAB button
- State layers: Implement hover/active states with opacity changes
- Typography scale: Material's type scale for consistent hierarchy
- Transitions: duration-300 for smooth interactions

### Visual Effects
- **Parallax scroll**: Main body content visible beneath fixed header with blur-sm backdrop
- **Die animation**: Rotate3d transform with ease-out timing
- **Blur effect**: backdrop-filter: blur(8px) on scrolled header
- No hover effects on buttons over images (N/A for this app)

### Images/SVG Assets
- **Logo**: Geometric SVG (single color, scalable) - suggest isometric cube or d20 silhouette
- **Die**: 3D isometric SVG cube with visible faces and number labels
- No hero image needed - feature-focused single-page interface

This hackathon skeleton prioritizes clean Material aesthetics, smooth interactions, and accessibility while remaining simple enough for rapid LLM-assisted development.