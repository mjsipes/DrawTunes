## DrawTunes 🎨🎵

**Live App: https://drawtunes.vercel.app/**

DrawTunes is a website where you can draw or upload images and receive a list of song recommendations. The AI analyzes your artwork and suggests music that matches the mood and style of your creation.

### The Journey Behind the Tech

In fall 2024, I attended HackSC at my university where my friend's roommate [Noah Pinale](https://www.linkedin.com/in/noahpinales/) ([GitHub](https://github.com/noahpin)) created an application called [SketchTune](https://sketchtune.vercel.app/). I thought it was very cool and wondered about how he built it.

Eight months later, after gaining experience with Supabase databases and edge functions through my F1 Racer project, I looked back at Noah's work and realized I could recreate it myself.

I'd recently watched a Y Combinator video emphasizing how crucial exceptional design will be for web applications moving forward. In my previous projects, I treated the interface as just something I had to complete to make the functionality work. This time, I wanted everything to be about the user experience and design.

Design became the primary focus of this project. Every component, interaction, and visual element was carefully considered. I wanted to prove to myself that I could build something that wasn't just functional, but genuinely delightful to use.

### Design Philosophy

Simple and responsive.

### Tech Stack

- **Frontend**: Built with [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev)
- **Styling**: Designed with [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Backend**: Powered by [Supabase](https://supabase.com) (PostgreSQL + Edge Functions)
- **AI**: Integrated with OpenAI GPT API
- **Hosting**: Deployed on [Vercel](https://vercel.com)

### Cool Features I've Built

- **AI-Powered Music Generation** - Transform sketches into unique musical compositions
- **Real-time Drawing Canvas** - Responsive drawing experience with multiple tools
- **Intelligent Prompt Processing** - ChatGPT integration for creative music descriptions
- **Seamless State Management** - Complex component synchronization using React Context
- **Modern Component Architecture** - Reusable, type-safe components throughout

### Technical Challenges

**State Management Complexity**: 
My website has many components. Sidebar, drawing canvas, upoad area, audio player, ai summary, and recomendations table. When I click on a song in the recomendations table, I want the audio player to play that song. When I click a drawing on the sidebar, I want the recomendations table to load the recomendations from that drawing, I want the ai_summary to load the summary from that drawing, and I want the audio component to display the first song in the recomendations table. When I click the button "get music recomendations" i want the audio player, ai summary and recomendations table to all go into a loading state, then when the new recomendations are ready, I want all three components to load the new data. The relationships between components got increasingly complex as I built the project.

This is when I was introduces to state manegement. Central data store. Stores the current drawing, the current recommendations. The datastore subscribes to changes in the database and fetches when changes are made. The datastore's job is to stay up to date with the correct information. Then the components just grab the data they need from the data store. They do not need to worry about interacting with the database or making sure their data is up to date, they just focus on being the component that they are and trust that it is the job of the datastore to have the correct information. 

My data store is still not perfect. I am currently using a single react context- all components have access to the same state, and when the context updates, everything stays perfectly synchronized. However, this is still an ongoing challenge because with my current implementation, every component rerenders whenever any part of the state changes. Since everything is tied to one React context, there are many unnecessary rerenders. Luckily the app is small enough that performance isn't affected, but it's something I want to optimize. Im looking into migrating from react context to zustand state manegment system.

**Component Testing**: My goal is to have fine-grained control over every small component and function in my application so I can test them thoroughly. I spent a lot of time learning how to break up my edge function into small pieces. Since Supabase edge functions use a Deno runtime, I learned how to use the Deno CLI to run and test individual functions locally. This was a big accomplishment because I can now test small pieces of my edge function logic instead of only being able to test the entire function through HTTP requests while served locally or deployed remotely.
While I had great success with this approach for backend functions, I still want to figure out how to do similar granular testing with UI components.

/ maintaining control over the get recomendations backend pipiline edge function.
then lets talk about testing, what i said about my goal is to have fine grained control over every small component and function in my applciation and be able to test them really well. i spent a lot of time learning about how to break up my edge function into small peices. supabase edge function uses a deno runtime and so i learned how to use the deno cli tool to run small functions. this was a big accomplishment because then i could test small peices of function as part of my greater edge function instead of just testing my entire edge function with an http request while served locally or deployed remotely. then while i had a lot of success with this, i still want to figure out how to do similar testing with ui components