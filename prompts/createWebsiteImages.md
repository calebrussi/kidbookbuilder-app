# Website Image Prompt Creation

**Instructions:**
- This prompt should create a `websiteImages.md` file in the `outputs` folder.
- This prompt should also create an `images` folder inside the `outputs` directory if it does not already exist.
- Use the `websiteContent.md` file in the `outputs` folder to identify all required images for the website. 
- If `outputs/backstory.md` does not exist, instruct the user to run the `createBackstory.md` prompt before proceeding.
- If `outputs/websiteContent.md` does not exist, instruct the user to run the `createWebsiteContent.md` prompt before proceeding.
- Reference the `outputs/backstory.md` file for tone, theme, and context if needed.
- If `outputs/colorPalette.md` does not exist, instruct the user to run the `createColorPalette.md` prompt before proceeding.
- Reference the `outputs/colorPalette.md` file for color and style guidance when generating image prompts.
- The process should be collaborative and iterative, following these steps:
  1. Review the `websiteContent.md` document to identify every section or element that requires an image (e.g., hero images, icons, illustrations, backgrounds, etc.).
  2. For each required image, work with the user to clarify the desired style, subject, mood, and any specific requirements, referencing the backstory, website content, and color palette for consistency.
  3. Generate a clear, detailed prompt for each image that can be used in ChatGPT or an image generation tool (such as DALL·E, Midjourney, or similar).
  4. Document each image prompt in `websiteImages.md`, organized by website section or usage.
  5. Instruct the user to manually generate the images using ChatGPT or their preferred tool, and save the resulting images in the `outputs/images` folder.

---

**Prompt:**

Begin by automatically creating a `websiteImages.md` file in the `outputs` folder and an `images` folder inside the `outputs` directory if it does not already exist.

Follow this collaborative process to create image prompts for the website, using the website content, backstory, and color palette as your reference:

1. **Identify Required Images:**
   - Review the `websiteContent.md` document and list every section or element that requires an image (e.g., HERO section background, ABOUT section illustration, CTA icon, etc.).
   - For each image, note its intended use and any relevant context from the website content.

2. **Define Image Requirements:**
   - For each required image, discuss with the user the desired visual style, subject matter, mood, color palette, and any specific details or constraints.
   - Reference the `backstory.md` and `colorPalette.md` documents for thematic, stylistic, and color guidance.

3. **Draft Image Prompts:**
   - Write a clear, detailed prompt for each image, suitable for use in ChatGPT or an image generation tool.
   - Each prompt should specify the subject, style, mood, color scheme (referencing `colorPalette.md`), and any other relevant details to ensure consistency with the website's theme.
   - Organize the prompts in `websiteImages.md` by website section or usage.

4. **Manual Image Generation:**
   - Instruct the user to use the generated prompts in ChatGPT or their preferred image generation tool to create the images.
   - The user should save each generated image in the `outputs/images` folder, named according to its website section or usage (e.g., `hero-background.png`, `about-illustration.png`).

5. **Review and Iterate:**
   - Review the generated images with the user to ensure they meet the website's needs and are consistent with the overall theme, content, and color palette.
   - Revise prompts and regenerate images as needed until all images are satisfactory.

--- 