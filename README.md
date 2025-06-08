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

### Technical Challenges

**State Management Complexity**: 
My website has many components. Sidebar, drawing canvas, upoad area, audio player, ai summary, and recomendations table. When I click on a song in the recomendations table, I want the audio player to play that song. When I click a drawing on the sidebar, I want the recomendations table to load the recomendations from that drawing, I want the ai_summary to load the summary from that drawing, and I want the audio component to display the first song in the recomendations table. When I click the button "get music recomendations" i want the audio player, ai summary and recomendations table to all go into a loading state, then when the new recomendations are ready, I want all three components to load the new data. The relationships between components got increasingly complex as I built the project.

This is when I was introduces to state manegement. Central data store. Stores the current drawing, the current recommendations. The datastore subscribes to changes in the database and fetches when changes are made. The datastore's job is to stay up to date with the correct information. Then the components just grab the data they need from the data store. They do not need to worry about interacting with the database or making sure their data is up to date, they just focus on being the component that they are and trust that it is the job of the datastore to have the correct information. 

My data store is still not perfect. I am currently using a single react context- all components have access to the same state, and when the context updates, everything stays perfectly synchronized. However, this is still an ongoing challenge because with my current implementation, every component rerenders whenever any part of the state changes. Since everything is tied to one React context, there are many unnecessary rerenders. Luckily the app is small enough that performance isn't affected, but it's something I want to optimize. Im looking into migrating from react context to zustand state manegment system.


**AI-Powered Music Generation**
When I click the button "get music recomednations". 1) your drawing / image is uploaded to a storage bucket in supabase. 2) A webhook on inserts on the storage bucket invokes and edge funtion that takes the drawing/ image as input. It creates 5 music recomendations and an ai_summary explaing the songs it chose, which it adds to the database. this is one edge function. Input: drawing/ image. Output: song recomendations + ai_message. 

Developing this edge function, I can serve it locally or deploy it remotely and test it. This would involve invoking it through an http request. I could inspect the output and I can inspect the logs. But I would prefer to have more fine grained control over the edge function.

The edge function takes multiple steps which involves invoking two api calls. If something broke I would not know immediatly what broke until I dove deeper. The edge function takes the drawing / image, sends it to open ai api with a prompt asking to give 5 music recomendations based upon this image and an ai_message explaing the choises. The api returns 

{
"songs": [
{"title": "Song Name 1", "artist": "Artist Name 1"},
{"title": "Song Name 2", "artist": "Artist Name 2"},
],
"message": "I focused on [your specific angle] because [detailed reasoning]"
}

Each song name and song title is sent to the itunes api which returns 
the songs full metadata.

{"title": "Song Name 1", "artist": "Artist Name 1"}

-> 

{"kind": "song", "country": "USA", "trackId": 1045058681, "artistId": 178834, "currency": "USD", "discCount": 2, "trackName": "Born to Run", "artistName": "Bruce Springsteen", "discNumber": 1, "previewUrl": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/a8/b7/0a/a8b70ad0-b907-0360-99b1-5bf23bdc8322/mzaf_11319548672709322634.plus.aac.p.m4a", "trackCount": 18, "trackPrice": 1.29, "releaseDate": "1975-08-25T07:00:00Z", "trackNumber": 5, "wrapperType": "track", "artworkUrl30": "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/a6/a6/53/a6a65331-d20b-53b5-766a-0c79c78f1e73/886445412307.jpg/30x30bb.jpg", "artworkUrl60": "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/a6/a6/53/a6a65331-d20b-53b5-766a-0c79c78f1e73/886445412307.jpg/60x60bb.jpg", "collectionId": 1045058131, "isStreamable": true, "trackViewUrl": "https://music.apple.com/us/album/born-to-run/1045058131?i=1045058681&uo=4", "artistViewUrl": "https://music.apple.com/us/artist/bruce-springsteen/178834?uo=4", "artworkUrl100": "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/a6/a6/53/a6a65331-d20b-53b5-766a-0c79c78f1e73/886445412307.jpg/100x100bb.jpg", "collectionName": "The Essential Bruce Springsteen", "collectionPrice": 14.99, "trackTimeMillis": 271200, "primaryGenreName": "Rock", "collectionViewUrl": "https://music.apple.com/us/album/born-to-run/1045058131?i=1045058681&uo=4", "trackCensoredName": "Born to Run", "trackExplicitness": "notExplicit", "collectionCensoredName": "The Essential Bruce Springsteen", "collectionExplicitness": "explicit"}


The song name and data is then stored in the database.

What if something broke? It would be nice if I could test stuff individually.

I thought about making the call to itunes api and chat gpt separate edge functions, but then its many calls over the network and cold starts.

So I break up the call to chat gpt and open ai into separate javascript functions.

This way I can test the functions locally using deno cli. I can create tests with deno.test.
Much more fine grain control.


/ maintaining control over the get recomendations backend pipiline edge function.
then lets talk about testing, what i said about my goal is to have fine grained control over every small component and function in my applciation and be able to test them really well. i spent a lot of time learning about how to break up my edge function into small peices. supabase edge function uses a deno runtime and so i learned how to use the deno cli tool to run small functions. this was a big accomplishment because then i could test small peices of function as part of my greater edge function instead of just testing my entire edge function with an http request while served locally or deployed remotely. then while i had a lot of success with this, i still want to figure out how to do similar testing with ui components

 I still want to figure out how to do similar granular testing with UI components.











