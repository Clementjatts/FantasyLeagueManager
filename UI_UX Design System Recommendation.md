# **UI/UX Design System Recommendation: "Electric"**

## **1\. Executive Summary**

This document outlines a new design system, "Electric," created to refresh the Fantasy Premier League Manager application. The goal is to move away from muted colors to a vibrant, bold, and tech-focused palette that aligns with modern sports analytics trends for 2025\.

The "Electric" system is built on a foundation of **electric cyan**, vibrant magenta accents, and high-saturation colors. It retains the desired "Glass and Glow" aesthetic but amplifies it with bold, eye-catching colors that create a premium, modern, and sophisticated experience for data-driven applications.

## **2\. Core Design Principles**

* **Data-First Clarity:** The color palette must ensure that data visualizations, tables, and statistics are the heroes of the interface. Colors are used to guide the eye and create meaning, not distract.  
* **Energetic & Professional:** The aesthetic should feel dynamic and exciting, like the sport itself, while maintaining a sense of trustworthiness and analytical precision.  
* **Accessibility as Standard:** All primary color combinations for text and backgrounds must meet WCAG AA contrast standards to ensure usability for everyone.  
* **Modern Aesthetics:** We will leverage gradients and glassmorphism to create a sense of depth and a premium, modern feel, reflecting current design trends in tech and sports media.

## **3\. The "Electric" Color Palette**

This palette is designed to be vibrant, bold, and tech-focused across both light and dark modes with maximum saturation for eye-catching appeal.

| Role | Color Name | Light Mode (HEX) | Dark Mode (HEX) | Rationale & Color Psychology |
| :---- | :---- | :---- | :---- | :---- |
| **Primary** | Electric Cyan | \#00E5FF | \#00B8D4 | **Tech, Data, Innovation.** A vibrant electric cyan that evokes technology, data streams, and modern analytics platforms. |
| **Secondary** | Vibrant Magenta | \#FF1493 | \#FF69B4 | **Energy, Highlights, Distinction.** A bold magenta for secondary CTAs, key stats, and differentiating data points. |
| **Background** | Clean Slate | \#FAFBFC | \#0A0E1A | A pristine light background and deep navy-black for dark mode provide maximum contrast for vibrant elements. |
| **Surface** | Frosted Glass | rgba(250,251,252,0.6) | rgba(10,14,26,0.6) | Semi-transparent surface for cards and modals with enhanced glassmorphism effects. |
| **Text (Primary)** | Deep Ink | \#0F172A | \#F8FAFC | High-contrast, highly legible text optimized for vibrant backgrounds. |
| **Text (Muted)** | Slate Gray | \#64748B | \#94A3B8 | A softer gray for secondary information that doesn't compete with vibrant elements. |
| **Border** | Subtle Edge | rgba(100,116,139,0.3) | rgba(148,163,184,0.2) | Minimal borders that define elements without interfering with vibrant colors. |
| **Success** | Bright Mint | \#00FF88 | \#00FF88 | A vibrant mint green for success states and positive metrics. |
| **Warning** | Vibrant Amber | \#FFB800 | \#FFB800 | A bold amber for warnings and important notifications. |
| **Destructive** | Hot Red | \#FF0055 | \#FF0055 | A striking red for errors, negative stats, and destructive actions. |
| **Info** | Bright Cyan | \#00D9FF | \#00D9FF | A complementary cyan for informational elements and data highlights. |

## **4\. Component Mapping & Styling**

Here is a detailed breakdown of how to apply the "Electric" palette to your UI components.

| UI Component | Element | Color Mapping (Light/Dark) | Justification & Effects |
| :---- | :---- | :---- | :---- |
| **Global** | Page Background (body) | Clean Slate | Provides maximum contrast for vibrant electric elements to pop dramatically. |
|  | Headings (h1, h2, etc.) | Deep Ink | Maximum readability for titles. Use Electric Cyan gradients for hero headings. |
|  | Body Text (p, span) | Deep Ink for primary text, Slate Gray for muted/secondary text. | Creates clear hierarchy while allowing vibrant accents to dominate. |
| **Buttons** | Primary CTA | **Gradient:** Electric Cyan to deeper cyan (\#0099CC). White text. | A bold, tech-focused button with electric glow effects. |
|  | Secondary | Frosted Glass background, Subtle Edge border, Deep Ink text. | Modern glassmorphism that complements without competing. |
| **Cards** | Background & Border | Frosted Glass background, Subtle Edge border. | **Enhanced Glassmorphism:** Apply backdrop-blur-xl with electric cyan glow shadows. |
| **Badges** | Player Form (Good) | Bright Mint background, White text. | Instantly communicates positive performance with vibrant color. |
|  | Player Form (Poor) | Hot Red background, White text. | Bold indication of negative performance. |
|  | Price/Position | Slate Gray background (low opacity), Deep Ink text. | Neutral badges that don't interfere with vibrant elements. |
| **Tables** | Header Row | Clean Slate background. | Clean foundation for vibrant data elements. |
|  | Row Hover | Electric Cyan with 15% opacity. | Bold visual feedback reinforcing the electric brand color. |
| **Tabs** | Inactive Tab | Clean Slate background, Slate Gray text. | Muted appearance to show they are not selected. |
|  | Active Tab | Electric Cyan background, White text. | Bold indication of active state using primary color. |
| **Dialogs/Modals** | Overlay & Content | Deep Ink with 80% opacity for overlay. Frosted Glass with backdrop-blur for content. | Creates dramatic layered glass effect with electric accents. |
| **Inputs** | Border & Ring | Subtle Edge for default state. On focus, use Electric Cyan for the focus ring (ring-2). | Clear feedback with electric glow on active inputs. |
| **Tooltips** | Background & Text | Deep Ink background, Clean Slate text. | High-contrast tooltips that stand out against vibrant backgrounds. |
| **Progress Bars** | Track & Indicator | Slate Gray (low opacity) for the track. Electric Cyan for the indicator fill. | Bold progress indication with electric glow effects. |

## **5\. Implementation Guide**

To implement the "Apex" design system, update your client/src/index.css file with these new CSS variables. This will cascade the changes throughout your component library.

@layer base {  
  :root {  
    /\* Apex Palette \- Light Mode \*/  
    \--background: 203 22% 96%; /\* Slate Echo \*/  
    \--foreground: 222 84% 5%; /\* Inkwell \*/  
      
    \--card: 210 20% 95% / 0.6; /\* Frosted Glass \*/  
    \--card-foreground: 222 84% 5%;

    \--popover: 203 22% 96%;  
    \--popover-foreground: 222 84% 5%;

    \--primary: 158 81% 42%; /\* Apex Green \*/  
    \--primary-foreground: 203 22% 96%;

    \--secondary: 282 83% 58%; /\* Volt Magenta \*/  
    \--secondary-foreground: 210 40% 98%;

    \--muted: 215 20% 65%; /\* Slate Gray \*/  
    \--muted-foreground: 215 16% 47%;

    \--accent: 215 20% 90%;  
    \--accent-foreground: 222 47% 11%;

    \--destructive: 0 84% 60%;  
    \--destructive-foreground: 210 40% 98%;

    \--border: 215 20% 65% / 0.3; /\* Slate Border \*/  
    \--input: 215 20% 65% / 0.3;  
    \--ring: 158 81% 42%; /\* Apex Green \*/

    \--radius: 0.75rem;

    /\* Semantic Colors \*/  
    \--success: 142 71% 45%; /\* Success Green \*/  
    \--warning: 38 92% 50%; /\* Warning Amber \*/  
    \--info: 204 70% 53%; /\* Sky Blue \*/  
  }

  .dark {  
    /\* Apex Palette \- Dark Mode \*/  
    \--background: 222 47% 11%; /\* Slate Echo \*/  
    \--foreground: 210 40% 98%; /\* Inkwell \*/

    \--card: 216 34% 17% / 0.6; /\* Frosted Glass \*/  
    \--card-foreground: 210 40% 98%;

    \--popover: 222 47% 11%;  
    \--popover-foreground: 210 40% 98%;

    \--primary: 157 67% 53%; /\* Apex Green \*/  
    \--primary-foreground: 158 81% 10%;

    \--secondary: 282 83% 80%; /\* Volt Magenta \*/  
    \--secondary-foreground: 282 83% 10%;

    \--muted: 215 28% 17%; /\* Slate Gray \*/  
    \--muted-foreground: 215 20% 65%;

    \--accent: 215 28% 17%;  
    \--accent-foreground: 210 40% 98%;

    \--destructive: 0 72% 51%;  
    \--destructive-foreground: 210 40% 98%;

    \--border: 215 20% 65% / 0.2; /\* Slate Border \*/  
    \--input: 215 20% 65% / 0.2;  
    \--ring: 157 67% 53%; /\* Apex Green \*/  
      
    /\* Semantic Colors \*/  
    \--success: 142 60% 55%;  
    \--warning: 43 96% 56%;  
  }  
}

This comprehensive system provides a vibrant, professional, and scalable foundation for your FPL Manager application, ensuring an engaging and highly readable user experience.