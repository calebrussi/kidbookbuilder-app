# Website Content Structure Prompt

**Instructions:**
- This prompt should create a `websiteContent.md` file in the `outputs` folder.
- Use the `backstory.md` file in the `outputs` folder as the reference for content and tone.
- If `outputs/backstory.md` does not exist, instruct the user to run the `createBackstory.md` prompt before proceeding.
- The creation of `websiteContent.md` should be an iterative process in a chat session, following these steps:
  1. Work with the user to define all the sections that will go into the website before writing any content.
  2. Once the sections are defined, provide placeholders in `websiteContent.md` for the content required for each section.
  3. Collaborate with the user in chat to develop specific content for each placeholder, drawing from the backstory document.

---

**Prompt:**

Follow this three-step, collaborative process to create structured website content for a landing page, using the backstory document as your reference:

1. **Define Website Sections:**
   - Begin by working with the user to identify and agree on all the sections that should appear on the website (e.g., HERO, ABOUT, CTA, TIMELINE, etc.).
   - Do not proceed to content creation until the full list of sections is confirmed.

2. **Add Placeholders:**
   - Once the sections are defined, create a `websiteContent.md` file in the `outputs` folder.
   - For each section, add a placeholder in the document for the content that will be developed.
   - Each placeholder should include the section title and a brief description of the type of content needed.

3. **Fill in Content Collaboratively:**
   - Work with the user in chat to develop specific content for each section, one at a time.
   - For each section, suggest a title, a brief description, and draft the main content, ensuring consistency with the backstory and thematic hook.
   - Propose relevant calls to action, taglines, or supporting details as appropriate.
   - Iterate and refine the content with the user's feedback until all sections are complete.

Repeat this process for any additional sections as needed. The goal is to collaboratively create a complete, compelling, and well-structured landing page content outline suitable for website generation.

--- 