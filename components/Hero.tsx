interface HeroProps {
  title: string;
  subtitle: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-base-content">
        {title}
      </h1>
      <p className="mt-4 text-lg text-base-content opacity-70">
        {subtitle}
      </p>
    </div>
  );
}
