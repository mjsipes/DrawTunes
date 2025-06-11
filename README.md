# DrawTunes 🎨🎵

**Live App: https://drawtunes.vercel.app/**

DrawTunes is a web application where you can draw or upload images and receive personalized song recommendations. The AI analyzes your artwork and suggests music that matches the mood, color palette, and artistic style of your creation.

## The Journey Behind the Tech

In fall 2024, I attended HackSC at my university where my friend's roommate [Noah Pinale](https://www.linkedin.com/in/noahpinales/) ([GitHub](https://github.com/noahpin)) created an application called [SketchTune](https://sketchtune.vercel.app/). I thought it was fascinating and wondered about the technical implementation behind it.

Eight months later, after gaining experience with Supabase databases and edge functions through my F1 Racer project, I looked back at Noah's work and realized I could recreate and improve upon it myself.

I'd recently watched a Y Combinator video emphasizing how crucial exceptional design will be for web applications moving forward. In my previous projects, I treated the interface as just something I had to complete to make the functionality work. This time, I wanted everything to be about the user experience and design.

## Design Philosophy

Simple and responsive. Every interaction should feel intuitive and every component should serve a clear purpose in the user's creative journey.

## Tech Stack

- **Frontend**: Built with [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev)
- **Styling**: Designed with [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Backend**: Powered by [Supabase](https://supabase.com) (PostgreSQL + Edge Functions)
- **AI**: Integrated with OpenAI GPT API
- **Testing**: Deno for edge function testing and modular development
- **Hosting**: Deployed on [Vercel](https://vercel.com)

## Technical Challenges & Solutions

### State Management Complexity

DrawTunes features multiple interconnected components: sidebar, drawing canvas, upload area, audio player, AI summary, and recommendations table. The challenge was managing complex state relationships between these components.

**The Problem**: 
- When a user clicks a song in the recommendations table, the audio player needs to play that song
- When a user selects a drawing from the sidebar, the recommendations table, AI summary, and audio player all need to update with that drawing's data
- When the "Get Music Recommendations" button is clicked, multiple components need to enter loading states, then synchronize when new data arrives

**Initial Approach**: 
I started with React Context, creating a single centralized state that all components could access. This solved the synchronization problem but created a performance issue—every component re-rendered whenever any part of the state changed.

**Current Solution**: 
While I initially planned to migrate to Zustand for more granular state management, I found that React Context actually works well for this application's scale. The key was optimizing the context structure and being selective about what triggers re-renders. For a small application like DrawTunes, the performance impact is negligible, and the simplicity of React Context outweighs the benefits of a more complex state management system.

The context manages:
- Current drawing and drawing history
- Music recommendations and playback state  
- Canvas operations and UI state
- Loading states across all components

### AI-Powered Music Recommendation Pipeline

The core functionality of DrawTunes relies on a sophisticated AI pipeline that transforms visual art into music recommendations.

**Architecture**:
When a user requests music recommendations, the following process occurs:

1. **Image Upload**: The drawing/image is uploaded to a Supabase storage bucket
2. **Webhook Trigger**: A database trigger on storage inserts invokes a Supabase Edge Function
3. **AI Analysis**: The edge function processes the image through OpenAI's vision API
4. **Music Matching**: Song recommendations are fetched from the iTunes API
5. **Data Storage**: Results are stored in the database and synchronized to the frontend

**Edge Function Design**:
Initially, I built this as a monolithic edge function, but debugging and testing were challenging. I couldn't easily isolate which part of the pipeline was failing without diving deep into logs.

**Modular Solution**:
I refactored the edge function into separate, testable modules:

- `openai.ts`: Handles image analysis and recommendation generation
- `itunes.ts`: Manages iTunes API integration and metadata fetching  
- `test.ts`: Provides unit tests for individual components
- `index.ts`: Orchestrates the pipeline

This modular approach allows me to:
- Test each component independently using Deno CLI
- Debug specific parts of the pipeline
- Develop and iterate on individual functions
- Maintain cleaner, more focused code

**AI Prompt Engineering**:
The OpenAI integration uses carefully crafted prompts that analyze:
- Color palette and mood
- Artistic style and technique
- Visual composition and energy
- Emotional tone and atmosphere

The API returns structured JSON with song recommendations and an explanation of the AI's reasoning process.

**Example Pipeline Flow**:

```
🎨 User Drawing
    ↓
📤 Storage Upload (Supabase Bucket)
    ↓
⚡ Edge Function Trigger (Database Webhook)
    ↓
🤖 OpenAI Analysis (Vision API)
    ↓
🎵 iTunes API Calls (Song Metadata)
    ↓
💾 Database Storage (Recommendations + AI Summary)
    ↓
🔄 Frontend State Update (React Context)
    ↓
✨ UI Refresh (All Components Synchronized)
```

### Component Architecture & Reusability

DrawTunes uses a component-driven architecture built on shadcn/ui components. Each major feature area (drawing, music, recommendations) is broken into focused, reusable components that communicate through the centralized state.

**Key Design Patterns**:
- **Compound Components**: Complex UI elements like the sidebar and audio player are built from smaller, composable pieces
- **Custom Hooks**: Functionality like `useSupabaseUpload` encapsulates complex logic and provides clean interfaces
- **Separation of Concerns**: Components focus on presentation while the context handles all business logic

This architecture makes the codebase maintainable and allows for easy feature additions without disrupting existing functionality.

---

*This project represents my journey from viewing UI as a necessary evil to embracing design as a core part of the development process. Every technical decision was made with the user experience in mind.*











