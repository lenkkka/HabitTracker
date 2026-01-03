export default function OceanWaves(){
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      <svg viewBox="0 0 1440 320" style={{ position:"absolute", top:-40, left:0, width:"110%", opacity:.18 }}>
        <path fill="rgb(53,197,255)" fillOpacity="1"
          d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,224C840,235,960,213,1080,197.3C1200,181,1320,171,1380,165.3L1440,160L1440,0L0,0Z" />
      </svg>

      <svg viewBox="0 0 1440 320" style={{ position:"absolute", bottom:-30, left:0, width:"120%", opacity:.22 }}>
        <path fill="rgb(26,123,255)" fillOpacity="1"
          d="M0,64L60,90.7C120,117,240,171,360,197.3C480,224,600,224,720,202.7C840,181,960,139,1080,128C1200,117,1320,139,1380,149.3L1440,160L1440,320L0,320Z" />
      </svg>
    </div>
  );
}
