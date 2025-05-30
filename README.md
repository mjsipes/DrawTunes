## DrawTunes

**Live App: https://drawtunes.vercel.app/**


### The Journey Behind the Tech
In the fall of 2024 I went to the HackSC hackathon at my university. One of my friends roomates Noah Pinale created an application called sketchtune 
https://sketchtune.vercel.app/
https://github.com/noahpin/sketchtune

I thought this app was such a good idea for a hackathon, I thought it was so cool. And I wondered a lot about how he did it. 8 months later, after spending a lot of time working with supabase database and edgefunctions, i finished this last semester looking back on his project and thinking i could actually probably make it myself. That is what I wanted to do. 

My emphasis for this project was design. I saw a youtube video from ycombinator a few months ago explaing that going forward, good design for websites will be incredibly important. In my last project around typeracer my focus was on the underlying technology. I saw the webpages as just something I had to do to complete the project. 

This project I wanted everythign to be about the user experience with the interface. 

I used a reuasable component library called shadcn to build the application. I emphasised simplicity.

What stayed the same
react, supabase, vercel
What was new
css->tailwind +shadcnui
javascript->typescript


New things / problems I learned. react usecontext / statemanegment. embedded components / large component tree.
why? because how do i synchronize state between the components. i could fetch from the database, but then i want it to be loading after you click the button.
### Technical Evolution
### Cool Features I've Built
### What's Next
profile my code
migrate from react context to zustand
FIGURE OUt how to break up and test every part of the code.