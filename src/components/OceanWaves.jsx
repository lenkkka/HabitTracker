export default function OceanWaves(){
  return (
    <div className="ocean-waves" style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {/* TOP waves */}
      <svg className="wave wave-top wave-a" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <g>
          <path
            d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,224C840,235,960,213,1080,197.3C1200,181,1320,171,1380,165.3L1440,160L1440,0L0,0Z"
          />
          <path
            d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,224C840,235,960,213,1080,197.3C1200,181,1320,171,1380,165.3L1440,160L1440,0L0,0Z"
            transform="translate(1440,0)"
          />
        </g>
      </svg>

      <svg className="wave wave-top wave-b" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <g>
          <path
            d="M0,240L80,224C160,208,320,176,480,176C640,176,800,208,960,218.7C1120,229,1280,219,1360,213.3L1440,208L1440,0L0,0Z"
          />
          <path
            d="M0,240L80,224C160,208,320,176,480,176C640,176,800,208,960,218.7C1120,229,1280,219,1360,213.3L1440,208L1440,0L0,0Z"
            transform="translate(1440,0)"
          />
        </g>
      </svg>

      {/* BOTTOM waves */}
      <svg className="wave wave-bottom wave-c" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <g>
          <path
            d="M0,64L60,90.7C120,117,240,171,360,197.3C480,224,600,224,720,208C840,192,960,160,1080,128C1200,117,1320,139,1380,149.3L1440,160L1440,320L0,320Z"
          />
          <path
            d="M0,64L60,90.7C120,117,240,171,360,197.3C480,224,600,224,720,208C840,192,960,160,1080,128C1200,117,1320,139,1380,149.3L1440,160L1440,320L0,320Z"
            transform="translate(1440,0)"
          />
        </g>
      </svg>

      <svg className="wave wave-bottom wave-d" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <g>
          <path
            d="M0,96L70,112C140,128,280,160,420,186.7C560,213,700,235,840,229.3C980,224,1120,192,1260,170.7C1400,149,1540,139,1610,133.3L1680,128L1680,320L0,320Z"
          />
          <path
            d="M0,96L70,112C140,128,280,160,420,186.7C560,213,700,235,840,229.3C980,224,1120,192,1260,170.7C1400,149,1540,139,1610,133.3L1680,128L1680,320L0,320Z"
            transform="translate(1680,0)"
          />
        </g>
      </svg>
    </div>
  );
}
