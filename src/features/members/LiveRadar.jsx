import "./live-radar.css";

export default function LiveRadar({ data }) {
  // Jika tidak ada data live, jangan tampilkan apa-apa
  if (!data || data.length === 0) return null;

  return (
    <section className="cek-live-radar">
      <div className="clr-header">
        <div className="clr-live-indicator">
          <span className="clr-pulse-dot"></span>
          <h2>NOW LIVE</h2>
        </div>
        <p className="clr-subtitle">Member yang sedang Live</p>
      </div>
      
      <div className="clr-avatar-row">
        {data.map((member, index) => (
          <a 
            key={index} 
            href={member.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="clr-avatar-wrapper"
          >
            {/* Pembungkus baru untuk efek tumpuk (overlap) */}
            <div className="clr-avatar-container">
              <div className="clr-avatar-ring">
                <img src={member.image_url} alt={member.name} />
              </div>
              <span 
                className="clr-platform-floating" 
                style={{ backgroundColor: member.platform === "IDN" ? "#2196f3" : "#ff4f9a" }}
              >
                {member.platform}
              </span>
            </div>
            
            <span className="clr-name">{member.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}