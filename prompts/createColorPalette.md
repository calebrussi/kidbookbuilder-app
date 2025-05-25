# Color Palette Creation Prompt

**Instructions:**
- This prompt should create a `colorPalette.md` file in the `outputs` folder.
- Use the `backstory.md` and `websiteContent.md` files in the `outputs` folder as the reference for tone, theme, and content.
- If either `outputs/backstory.md` or `outputs/websiteContent.md` does not exist, instruct the user to run the corresponding prompt(s) before proceeding.
- The creation of `colorPalette.md` should be an iterative process in a chat session, following these steps:
  1. Review the backstory and website content to identify the core themes, mood, and target audience.
  2. Collaborate with the user to determine the desired emotional impact and style for the color palette (e.g., bold, calming, playful, professional, etc.).
  3. Suggest an initial set of primary, secondary, and accent colors, providing hex codes and brief descriptions of their intended use (e.g., backgrounds, buttons, highlights).
  4. Iterate on the palette with the user's feedback, refining color choices and their roles until the palette feels cohesive and on-brand.
  5. Document the final color palette in `colorPalette.md`, including color swatches, hex codes, and usage notes for each color.

---

**Prompt:**

Follow this collaborative process to create a color palette for the landing page, using the backstory and website content as your reference:

1. **Review Source Material:**
   - Begin by reviewing the `backstory.md` and `websiteContent.md` documents to understand the subject, story, and intended mood of the website.
   - Identify any recurring themes, hooks, or emotional tones that should influence the color palette.

2. **Define Palette Goals:**
   - Ask the user about their preferences for the overall style and emotional impact of the color palette (e.g., energetic, trustworthy, innovative, etc.).
   - Discuss any specific colors or brand associations the user wants to include or avoid.

3. **Propose Initial Palette:**
   - Suggest a set of primary, secondary, and accent colors, each with a hex code and a short description of its intended use.
   - Present the palette visually (as swatches) and explain how each color supports the website's goals and story.

4. **Iterate and Refine:**
   - Work with the user to adjust the palette, making changes based on feedback and ensuring all colors work well together.
   - Refine the palette until it feels cohesive, distinctive, and aligned with the website's theme and audience.

5. **Document the Palette:**
   - Create a `colorPalette.md` file in the `outputs` folder.
   - For each color, include:
     - A color swatch (visual representation)
     - The hex code
     - A brief usage note (e.g., "Use for primary buttons", "Background color", etc.)
   - Ensure the documentation is clear and easy to reference for future design and development work.

--- 