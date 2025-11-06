interface HeroProps {
  title: string;
  subtitle: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="mt-4 text-lg opacity-70">
        {subtitle}
      </p>
    </div>
  );
}
