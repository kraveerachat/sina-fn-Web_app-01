Master Prompt: UI/UX Overhaul for Sina\_FN - Utopia Tokyo High-End Interactive Style



Role and Project Context



This task requires the expertise of a World-Class Creative Frontend Developer, a WebGL Expert, and a GSAP Master. The objective is to completely overhaul the UI/UX of "Sina\_FN", an AI-powered Personal Finance HUD built with Next.js (App Router), Tailwind CSS, React Three Fiber, and GSAP. The current UI is deemed too basic and resembles a standard flat admin template, necessitating a transformation into an award-winning, immersive, and high-end interactive experience.



Overall Aesthetic Direction: "High-End Holographic Financial HUD"



The aesthetic must be inspired by "Utopia Tokyo", characterized by sleek glassmorphism, deep dark backgrounds, and smooth kinetic typography. It is crucial to emphasize a sophisticated and futuristic feel, explicitly avoiding a "messy cyberpunk" appearance. The visual language should embody a blend of dystopian cyberpunk and high-end luxury, utilizing high-contrast visuals and neon accents (e.g., cyan, red, gold) to create a visually striking and immersive environment.



General Requirements



1\.

Performance: All animations and graphical effects must be highly optimized to ensure a smooth and consistent 60 frames per second (fps) experience. This includes meticulous optimization of Three.js requestAnimationFrame loops and efficient management of GSAP timelines.



2\.

Strict Typing: The entire codebase must adhere to strict TypeScript typing. This mandates the creation and consistent use of interfaces for all GSAP timelines, Three.js uniforms, and custom React hooks.



3\.

Animation Frameworks: GSAP (GreenSock Animation Platform) will serve as the primary animation library for all UI element transitions and kinetic typography. Three.js (via React Three Fiber) will be utilized for advanced background effects. Lenis will be integrated for frictionless, momentum-based smooth scrolling.



4\.

Component Logic Decoupling: Animation logic must be strictly decoupled from business logic. Custom React hooks should be employed for all GSAP and Three.js integrations to ensure modularity and maintainability.



5\.

Dynamic Imports for WebGL: WebGL/Three.js components must be isolated into standalone components and imported dynamically using next/dynamic with ssr: false to prevent server-side rendering (SSR) hydration errors and optimize initial load performance.



Component-Specific Implementations



1\. The Reactive WebGL Environment (PulseCanvas.tsx)



•

Upgrade to Custom Shader Material: The existing basic particle background must be upgraded to a highly immersive Custom Shader Material using React Three Fiber. This can be achieved either through @react-three/drei's MeshDistortMaterial or a custom GLSL shader. The material should be applied to a suitable geometry (e.g., a plane or sphere) to create a dynamic, evolving background.



•

Data-Driven Reactivity: The fluid/aurora background MUST react dynamically to the user's health\_score (sourced from Supabase profiles). Specific visual mappings are required:



•

Score 80-100: Exhibit slow, calm, elegant neon green (#00FF7F) fluid waves.



•

Score < 50: Transition to faster, aggressive, pulsing crimson/orange waves.







•

Mouse-Trail Distortion: Implement a subtle mouse-trail distortion effect within the WebGL environment to enhance interactivity and make the background feel alive.



•

Scanning Line Effect: Integrate a vertical or horizontal "scanning line" effect that sweeps across the screen periodically. This effect should be implemented via a fragment shader that interpolates a line across the UV coordinates based on a time uniform.



2\. Holographic UI \& Glassmorphism (Sidebar \& Cards)



•

Background Removal: Completely remove solid, blocky backgrounds from the Sidebar, Header, and Dashboard Cards.



•

Ultra-Premium Glassmorphism: Implement an ultra-premium glassmorphism effect using Tailwind CSS. This should include properties such as bg-black/20, backdrop-blur-2xl, and border border-white/5 to achieve a sleek, semi-transparent, and blurred appearance.



•

GSAP DrawSVG on Navigation: When hovering over sidebar menu items, utilize GSAP DrawSVG to animate a 1px glowing neon border drawing around the active item. The animation should draw the SVG path from 0% to 100% on hover and smoothly reverse on mouse leave.



•

Magnetic Micro-interactions: For functional buttons (e.g., the AI Chat button), implement subtle magnetic hover effects using Framer Motion to provide tactile feedback and enhance interactivity.



3\. GSAP Kinetic Typography \& HUD Reveals



•

The "Hacker Decrypt" Effect: For the main 'Net Balance' number (e.g., ฿21,460.00), employ GSAP SplitText or a ScrambleText simulation. Upon page load, the numbers should rapidly scramble through random characters before locking into the real balance, creating a high-tech reveal.



•

Cinematic Headers: All section headers (e.g., 'Wallets', 'Recent Transactions') must use GSAP SplitText. They should reveal character-by-character with a slight Y-axis upward stagger, creating a cinematic and engaging entrance animation.



4\. Smooth Scrolling \& 3D ScrollTriggers



•

Lenis Integration: Wrap the main application view in Lenis for frictionless, momentum-based smooth scrolling, ensuring a fluid user experience.



•

Dashboard Cards (Wallets, Goals, Spending): Implement GSAP ScrollTrigger for dashboard cards. As cards enter the viewport, they should perform a subtle 3D rotation (specifically rotateX and rotateY) combined with a staggered Y-offset slide-in animation, rather than a simple fade-in.



•

Holographic Sheen: Add a CSS/Tailwind-based "holographic sheen" overlay (a diagonal gradient shine) that reacts to onMouseMove across the wallet cards, simulating a dynamic specular highlight.



5\. AI Chat Bottom Sheet Integration



•

Dashboard Background Animation: When the AIChatBottomSheet slides up, trigger a GSAP timeline that slightly scales down and blurs the main dashboard background, creating a visual depth effect by pushing it back in 3D space.



•

AI-Generated Transaction Distinction: For transactions flagged with is\_ai\_generated: true (from the Supabase schema), apply a special visual distinction. This could be a glowing border or a subtle WebGL sparkle effect to clearly differentiate them from manually added entries.



Strict Technical Constraints



1\.

GSAP Hook Usage: Always use @gsap/react's useGSAP() hook for scope management and proper cleanup to prevent React strict-mode memory leaks.



2\.

WebGL Component Isolation: Keep WebGL/Three.js code strictly isolated into standalone components and import them dynamically (next/dynamic with ssr: false) to prevent hydration errors and ensure optimal performance.



3\.

TypeScript Strictness: Maintain strict TypeScript typing throughout the project. The use of the any type is prohibited.



This comprehensive prompt provides a detailed, technically precise, and actionable specification for achieving the desired "Utopia Tokyo" aesthetic overhaul for the Sina\_FN application.





