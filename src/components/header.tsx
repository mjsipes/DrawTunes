import reactLogo from "/react.svg";
import viteLogo from "/vite.svg";
import supabaseLogo from "/supabase-logo-icon.png";
import githubLogo from "/github-mark.png";
import vercelLogo from "/vercel.svg";
import tailwindLogo from "/tailwindcss.svg";
import shadcnLogo from "/shadcn.svg";

export default function Header() {
  return (
    <div className="text-center mb-6">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
        DrawTunes
      </h1>

      <div className="hidden md:inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md font-mono text-xs">
        <span>Built by</span>
        <a
          href="https://github.com/mjsipes"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={githubLogo} className="w-3.5 h-3.5" alt="Github" />
        </a>
        <span className="text-muted-foreground">•</span>
        <span>Built with</span>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="w-3.5 h-3.5" alt="React" />
        </a>
        <span className="text-muted-foreground">•</span>
        <span>Bundled by</span>
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="w-3.5 h-3.5" alt="Vite" />
        </a>
        <span className="text-muted-foreground">•</span>
        <span>Backend by</span>
        <a
          href="https://supabase.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={supabaseLogo} className="w-3.5 h-3.5" alt="Supabase" />
        </a>
        <span className="text-muted-foreground">•</span>
        <span>Styled with</span>
        <a
          href="https://tailwindcss.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-500 hover:text-cyan-400 transition-colors font-semibold"
        >
          <img src={tailwindLogo} className="w-3.5 h-3.5" alt="Tailwind" />
        </a>
        <a
          href="https://ui.shadcn.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-900 dark:text-neutral-100 hover:opacity-80 transition-opacity font-semibold"
        >
          <img src={shadcnLogo} className="w-3.5 h-3.5" alt="Shadcn/ui" />
        </a>
        <span className="text-muted-foreground">•</span>
        <span>Hosted on</span>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          <img src={vercelLogo} className="w-3.5 h-3.5" alt="Vercel" />
        </a>
      </div>
    </div>
  );
}
