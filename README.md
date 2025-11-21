# DrawTunes 🎨🎵

**Live App: https://drawtunes.vercel.app/**

DrawTunes is a web application where you can draw or upload images and receive personalized song recommendations. The AI analyzes your artwork and suggests music that matches the mood, color palette, and artistic style of your creation.

## The Journey Behind the Tech

In fall 2024, I attended HackSC at my university where my friend's roommate [Noah Pinales](https://www.linkedin.com/in/noahpinales/) ([GitHub](https://github.com/noahpin)) created an application called [SketchTune](https://sketchtune.vercel.app/). I thought it was fascinating and wondered about the technical implementation behind it.

Eight months later, after gaining experience with Supabase databases and edge functions through my F1 Racer project, I looked back at Noah's work and realized I could recreate and improve upon it myself.

I'd recently watched a Y Combinator video emphasizing how crucial exceptional design will be for web applications moving forward. In my previous projects, I treated the interface as just something I had to complete to make the functionality work. This time, I wanted everything to be about the user experience and design.

Frontend development used to seem like thankless work to me, but the evolution from raw CSS and jQuery to modern frameworks, design systems, and tools like Tailwind has transformed it into something more like digital craftsmanship. I wanted to explore what I could build with these tools and discover if I could genuinely enjoy the design process. Design became the primary focus of this project, with every component, interaction, and visual element carefully considered.

## Tech Stack

- **Frontend**: Built with [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev)
- **Styling**: Designed with [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Backend**: Powered by [Supabase](https://supabase.com) (PostgreSQL + Auth + Edge Functions)
- **APIs**: OpenAI API + iTunes API
- **Hosting**: Deployed on [Vercel](https://vercel.com)

## Technical Challenges & Solutions

### State Management Evolution: From Chaos to Clean Architecture

DrawTunes features multiple interconnected components: sidebar, drawing canvas, upload area, audio player, AI summary, and recommendations table. Managing complex state relationships between these components became the most significant technical challenge of the project.

**The Core Challenge**: 
- When a user clicks a song in the recommendations table, the audio player needs to play that song
- When a user selects a drawing from the sidebar, the recommendations table, AI summary, and audio player all need to update with that drawing's data
- When the "Get Music Recommendations" button is clicked, multiple components need to enter loading states, then synchronize when new data arrives

**Learning Journey - The Prop Drilling Nightmare**:
Initially, I started with component-level state and prop drilling. This quickly became unwieldy as the component tree deepened and more components needed to share data. Passing data down multiple levels and callbacks back up became a maintenance nightmare.

**First Attempt - All-in-One Context**:
To solve prop drilling, I moved everything into a single React Context. This included:
- Audio player state (progress, current time, play/pause)
- Drawing data and canvas operations
- Music recommendations and metadata

**The Problem with All-in-One Context**:
While this solved the data sharing issue, it created massive performance problems:
- Every state change triggered re-renders across the entire component tree
- The audio player's progress updates (every 500ms) caused the entire app to re-render
- Components that only needed one piece of data were re-rendering when unrelated data changed
- The context file became bloated and difficult to debug!

**Learning About State Boundaries**:
I realized I was putting the wrong things in global state. The audio player's internal operations (progress tracking, audio refs, play/pause logic) should be encapsulated within the component itself. Only the data that multiple components actually need should be global.

**Migration to Zustand**:
After optimizing what belonged in global vs. local state, I migrated from React Context to Zustand for several key benefits:

1. **Selective Subscriptions**: Components only re-render when the specific data they subscribe to changes, not when any part of the global state updates
2. **Learning from the Community**: Through YouTube videos and discussions with AI assistants, I learned about Zustand's developer-friendly features like devtools, which I'm excited to explore in future projects
3. **Cleaner Architecture**: Actions and state live together in the store, making the data flow more predictable

**The Results**:
- Re-renders dropped dramatically as components only updated when their subscribed data changed
- The overall developer experience improved significantly - code became much more readable

<table>
<tr>
<td><em>Before optimization (All-in-One Context):</em></td>
<td><em>After optimization (Zustand + Strategic State Placement):</em></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/mjsipes/drawtunes/main/public/profiler1a.png" alt="Before Optimization" width="400"></td>
<td><img src="https://raw.githubusercontent.com/mjsipes/drawtunes/main/public/profiler2a.png" alt="After Optimization" width="400"></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/mjsipes/drawtunes/main/public/profiler1b.png" alt="Before Optimization Detail" width="400"></td>
<td><img src="https://raw.githubusercontent.com/mjsipes/drawtunes/main/public/profiler2b.png" alt="After Optimization Detail" width="400"></td>
</tr>
</table>

The React Profiler screenshots show the dramatic reduction in re-renders after moving to Zustand and properly separating global vs. local state. What was once causing app-wide re-renders every 500ms (from audio progress updates) became isolated, component-specific updates.

Each block in these visualizations represents a component in the app's structure. When a block lights up in blue, it means that component is re-rendering (updating its display). The goal is to minimize unnecessary blue blocks—only the components that actually need to update should light up.

### AI-Powered Music Recommendation System

The core functionality of DrawTunes relies on the Supabase Edge Function—a serverless function that processes user uploads and connects multiple APIs to transform visual art into music recommendations.

**Architecture**:
When a user requests music recommendations, the following process occurs:

1. **Image Upload**: The drawing/image is uploaded to a Supabase storage bucket
2. **Webhook Trigger**: A database trigger on storage inserts invokes the Supabase Edge Function
3. **AI Analysis**: The edge function processes the image through OpenAI's vision API which returns a json array of song recomendations {title, artist}
4. **Music Matching**: The songs in the json array are sent to the Itunes API which returns extensive metadata about the song including the album image url and the song preview url, which are what are important to me.
5. **Data Storage**: The drawings's ai message, the songs, and the recomendations are all stored into the supabase database
6. **Real-time Updates**: Data fetching and subscription hooks monitor database changes and update the application state in real-time, ensuring the UI immediately reflects new recommendations and drawing data

**Edge Function Design Challenge**:
Initially, I built this as one big edge function, but debugging and testing were challenging. I couldn't easily isolate which part of the system was failing without diving deep into logs.

**Modular Solution**:
I refactored the edge function into separate, testable modules:

- `openai.ts`: Handles image analysis and recommendation generation
- `itunes.ts`: Manages iTunes API integration and metadata fetching  
- `test.ts`: Provides unit tests for individual components
- `index.ts`: Orchestrates the system

This modular approach allows me to test each component independently using Deno CLI and develop and iterate on individual functions.

## Personal Takeaways

| Design Philosophy | Architectural Philosophy |
|-------------------|-------------------------|
| Simple and responsive | Build with small pieces |
|                   | Don't repeat yourself |
