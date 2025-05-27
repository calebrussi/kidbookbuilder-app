# Kid Story Builder - Interactive Quest Map UI

Create a vibrant, kid-friendly React web application that serves as an interactive quest map for children (ages 8-12) to create their own stories through voice chat. This should be a pure UI/state management app without any backend functionality.

## 🎨 Design Requirements

**Visual Style:**

- Fun, cartoony, and captivating design inspired by Cocomelon
- Bright, cheerful colors that appeal to kids aged 8-12
- Quest map layout where users journey from area to area
- Mobile-first responsive design
- Use TailwindCSS for styling

**Quest Map Layout:**

- Render the workflow as an adventure map with different themed areas
- Each group becomes a visually distinct "area" on the map
- Each step within a group becomes a "quest" within that area
- Show a clear path connecting all areas and quests
- Display the workflow name prominently (e.g., "Character Creation Quiz")
- Include a child avatar character that moves along the quest path
- Position the avatar at the current active step location
- **3D Environment Features** (if using Three.js):
  - Isometric or third-person perspective quest map
  - 3D terrain with different biomes for each area (magical forest, castle, etc.)
  - Volumetric lighting and atmospheric effects
  - 3D avatar with walk cycles and idle animations
- **2D Environment Features** (if using Pixi.js or CSS):
  - Top-down or side-scrolling map perspective
  - Layered parallax backgrounds for depth
  - Rich sprite animations and particle effects
  - Smooth camera following and area transitions

## 🎯 Core Functionality

**Step States & Visual Indicators:**
Each step must visually represent one of these states:

- `not_started`: Initial state (grayed out or locked appearance)
- `in_progress`: Currently active step (glowing, highlighted, animated)
- `started`: Previously worked on but incomplete (partially filled/colored)
- `complete`: Finished step (bright colors, checkmark, celebration indicator)
- `error`: Technical error state (red indicator, warning icon)

**Interaction Rules:**

- Only one step can be `in_progress` at a time
- Users can click to reactivate any `started` or `complete` step
- Users cannot activate `not_started` steps (they must be sequential)
- Clicking an available step changes it to `in_progress`

**Animations:**

- Cute, kid-friendly animations when a step starts
- Celebration animation when a step completes
- Smooth transitions between states
- Hover effects on interactive elements
- Avatar walking animation when moving between quests
- Avatar idle animations while at a quest location
- Helper companion floating/bouncing animations
- **Area introduction animations**: Helper companion gets excited and shows speech bubble when entering new areas
- Companion attention-getting animations (gentle pulse, wave) when providing guidance

## 📱 Components to Build

### 1. Main Quest Map Component

- Display all groups as themed map areas
- Show progress indicators for individual steps, groups, and overall workflow
- Implement the quest path connecting all areas
- Handle step state management and transitions
- Manage child avatar positioning and movement animations
- Show quest path with footsteps or trail markers
- **3D Scene Management** (Three.js): Handle 3D scene setup, lighting, camera controls
- **2D Scene Management** (Pixi.js): Manage sprite containers, layer ordering, viewport transforms

### 2. Child Avatar Component

- Cute, kid-friendly character representing the child on their quest
- Positioned at the current active step location
- Walking animation when transitioning between steps
- Idle animations while at a quest (bouncing, looking around, etc.)
- Celebration animations when completing steps
- Customizable appearance (different clothing, colors, accessories)
- **3D Avatar Features**: Rigged 3D model with skeletal animations, facial expressions
- **2D Avatar Features**: Sprite sheet animations with smooth frame transitions

### 3. Help Companion Component

- Always-visible helper character (fairy, pet, magical creature)
- Floating or hovering near the child avatar
- Gentle bouncing/floating animation when idle
- Excited animation when clicked for help
- Speech bubble or glow effect when activated
- Friendly, approachable design that encourages interaction
- **Auto-explains new areas**: When child avatar enters a new area/group, companion automatically appears with explanation
- Shows tutorial speech bubbles with area-specific guidance
- Provides context about what quests are available in each area

### 4. Help Chat Interface

- Appears when help companion is clicked
- Chat bubble or modal interface
- Kid-friendly voice chat interface
- Easy-to-close design

### 5. Step/Quest Items

- Individual quest markers on the map
- Clear visual state indicators
- Smooth animations and transitions
- Accessibility-friendly click targets

### 6. Progress Indicators

- Overall workflow progress
- Individual group/area progress
- Visual completion percentage

## 📊 Sample Data Structure

Use this sample workflow data for the quest map:

```json
{
  "workflowName": "Character Creation Quiz",
  "groups": [
    {
      "id": "story-style",
      "name": "Tell Me Your Story Style",
      "theme": "magical-books",
      "description": "Welcome to the Story Style area! Here we'll discover what kind of stories you love to read and create. I'll help you pick the perfect style for your adventure!",
      "steps": [
        {
          "id": "favorite-stories",
          "title": "What stories do you love?",
          "description": "favorite genres and themes",
          "state": "complete"
        },
        {
          "id": "story-length",
          "title": "How long should your story be?",
          "description": "short stories, chapter books",
          "state": "in_progress"
        }
      ]
    },
    {
      "id": "story-world",
      "name": "Design Your Story World",
      "theme": "fantasy-castle",
      "description": "Amazing! Now we're in the World Building area! This is where we create the magical place where your story will happen. I'll guide you through choosing your perfect world!",
      "steps": [
        {
          "id": "world-type",
          "title": "Magic or Real World?",
          "description": "choose your world type",
          "state": "not_started"
        },
        {
          "id": "setting",
          "title": "Pick Your Setting",
          "description": "kingdoms, space, underwater, etc.",
          "state": "not_started"
        },
        {
          "id": "time-period",
          "title": "When Does It Happen?",
          "description": "past, present, future",
          "state": "not_started"
        },
        {
          "id": "environment",
          "title": "Weather & Places",
          "description": "environment details",
          "state": "not_started"
        }
      ]
    },
    {
      "id": "characters",
      "name": "Create Your Characters",
      "theme": "character-creator",
      "description": "Welcome to the Character Creator area! This is my favorite part - we get to design the heroes and friends in your story! Let's bring your characters to life together!",
      "steps": [
        {
          "id": "hero-personality",
          "title": "Your Hero's Personality",
          "description": "traits and qualities",
          "state": "not_started"
        },
        {
          "id": "friends-family",
          "title": "Friends & Family",
          "description": "supporting characters",
          "state": "not_started"
        },
        {
          "id": "special-powers",
          "title": "Special Powers",
          "description": "abilities and skills",
          "state": "not_started"
        },
        {
          "id": "challenges",
          "title": "Hero's Challenges",
          "description": "fears and obstacles",
          "state": "not_started"
        }
      ]
    },
    {
      "id": "adventure",
      "name": "Choose Your Adventure",
      "theme": "treasure-map",
      "description": "Wow! We've reached the final area - Adventure Planning! Here's where we decide what exciting things will happen in your story. This is going to be epic!",
      "steps": [
        {
          "id": "quest-type",
          "title": "Type of Quest",
          "description": "mystery, discovery, journey",
          "state": "not_started"
        },
        {
          "id": "emotions",
          "title": "Friendship & Feelings",
          "description": "emotional elements",
          "state": "not_started"
        },
        {
          "id": "obstacles",
          "title": "Challenges to Face",
          "description": "puzzles, battles, problems",
          "state": "not_started"
        },
        {
          "id": "ending",
          "title": "How It Ends",
          "description": "story outcome",
          "state": "not_started"
        }
      ]
    }
  ]
}
```

## 🎨 Visual Themes for Each Area

- **Tell Me Your Story Style**: Magical floating books, sparkles, reading nook vibes
- **Design Your Story World**: Fantasy castle, magical portals, world-building elements
- **Create Your Characters**: Character creation studio, avatar builders, personality bubbles
- **Choose Your Adventure**: Treasure map, compass, adventure gear, quest markers

## 👾 Avatar Design Guidelines

**Child Avatar:**

- Simple, friendly character design (could be customizable)
- Bright, cheerful colors that match the overall theme
- Clear walking/movement animations
- Expressive idle animations (looking around, small gestures)
- Victory/celebration poses for completed quests
- Should feel like a character the child can identify with

**Help Companion Options:**

- Magical fairy with sparkling trail
- Friendly dragon or cute monster
- Talking animal companion (owl, fox, rabbit)
- Floating magical orb with personality
- Robot buddy with expressive features
- Should complement but not overshadow the child avatar
- **Personality**: Enthusiastic, encouraging, and knowledgeable guide
- **Voice/Text**: Kid-friendly language with excitement and encouragement
- **Area Introductions**: Each area gets a unique, themed explanation from the companion

**Avatar Positioning System:**

- Avatar always positioned at the current active step
- Smooth transition animations between quest locations
- Clear visual path showing where the avatar has been
- Breadcrumb trail or footsteps marking completed areas
- Avatar should "look ahead" to the next available quest

## 🔧 Technical Requirements

- **Framework**: React with functional components and hooks
- **Styling**: TailwindCSS for all styling
- **State Management**: React useState/useContext for managing step states
- **Gaming Engine**: Choose one of the following for immersive visuals and animations:
  - **3D Option (Preferred)**: Three.js with React Three Fiber (@react-three/fiber) for 3D quest map environments
    - Use @react-three/drei for additional 3D helpers and components
    - Implement 3D avatar characters with simple rigged animations
    - Create 3D themed environments for each quest area
    - Add particle effects for magical elements and celebrations
  - **2D Option (Alternative)**: Pixi.js with @pixi/react for high-performance 2D graphics
    - Rich sprite-based animations for avatars and environments
    - Smooth tweening animations using GSAP or Pixi's built-in animation tools
    - Particle systems for magical effects and area transitions
  - **Lightweight 2D Option**: Pure CSS animations with Framer Motion for simple but polished 2D experience
    - Advanced CSS transforms and keyframe animations
    - Smooth component transitions and micro-interactions
    - SVG-based illustrations with animated elements
- **Animations**: Complement the chosen engine with CSS transitions and keyframes for UI elements
- **Responsive**: Mobile-first design, works well on tablets and phones
- **Accessibility**: Proper ARIA labels, keyboard navigation support
- **Performance**: Optimized for smooth 60fps animations on mobile devices

## 🎯 Key Features to Implement

1. **Quest Map Navigation**: Visual map showing the journey through all areas
2. **Avatar System**: Child character that moves along the quest path with smooth animations
3. **Help Companion**: Always-present helper character that provides assistance and area explanations
4. **Guided Experience**: Automatic area introductions and contextual help from the companion
5. **State Management**: Proper handling of step states and transitions
6. **Progress Tracking**: Multiple levels of progress indicators
7. **Interactive Elements**: Clickable steps with proper state validation
8. **Animation System**: Engaging animations for avatars, state changes, and interactions
9. **Mobile Optimization**: Touch-friendly interface optimized for mobile devices

## 🚀 Getting Started

Create a single-page React application that displays this interactive quest map with avatar characters. Focus on creating an engaging, kid-friendly UI with smooth character animations and delightful interactions using your chosen gaming engine. The app should feel like a real adventure game where kids are excited to guide their avatar through each step of their story creation journey.

**Recommended Setup Process:**

1. Initialize React project with TypeScript support
2. Install chosen gaming engine (Three.js + React Three Fiber for 3D, or Pixi.js for 2D)
3. Set up TailwindCSS for UI styling
4. Create basic 3D/2D scene with simple environment
5. Implement avatar character with basic animations
6. Build quest map layout with themed areas
7. Add state management for step progression
8. Implement helper companion with area explanations
9. Polish with particles, lighting, and sound effects

The child avatar should serve as the player's representation in this quest world, making the experience personal and engaging. The helper companion should feel like a trustworthy friend who's always there to help when needed.

Remember: This is a UI-only application with no backend functionality. All interactions should be handled through local state management, with special attention to avatar positioning and movement animations that correspond to the user's progress through the quest. The gaming engine should create an immersive, game-like experience that captivates children and makes story creation feel like play.
