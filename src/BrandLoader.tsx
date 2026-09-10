// Espera con marca. El mismo loop oficial se usa en toda la aplicación para que
// cualquier operación que tarde se vea como parte del banco y no como un freeze.
export const BrandLoader = ({
  label,
  size = 54,
  block = false,
}: {
  label: string;
  size?: number;
  block?: boolean;
}) => (
  <div className={block ? "brand-loader block" : "brand-loader"} role="status">
    <video
      src="/brand/ca-loop.mp4"
      poster="/brand/ca-loop-poster.png"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      autoPlay
      loop
      muted
      playsInline
      aria-hidden="true"
    />
    <span>{label}</span>
  </div>
);
